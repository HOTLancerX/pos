import { NextRequest, NextResponse } from 'next/server';
import { getSalesCollection, initializeSalesCollection } from '@/plugin/pos/models/Sale';
import { getCustomersCollection, initializeCustomersCollection } from '@/plugin/pos/models/Customer';
import Post from '@/models/post';
import PostInfo from '@/models/post_info';
import connectDB from '@/lib/mongodb';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

async function restoreProductStock(productId: string, variantId: string, quantity: number) {
    await connectDB();
    const postInfo = await PostInfo.findOne({ postId: productId, name: '_variate' });
    if (!postInfo) return;

    let variate: any;
    try { variate = JSON.parse(postInfo.value); } catch { return; }

    if (variate.priceType === 'variant' && variantId && variate.variants?.length > 0) {
        const variant = variate.variants.find((v: any) => v.id === variantId);
        if (variant) {
            const currentQty = parseInt(variant.quantity) || 0;
            variant.quantity = String(currentQty + quantity);
        }
    } else {
        const currentStock = parseInt(variate.stock) || 0;
        variate.stock = String(currentStock + quantity);
    }

    await PostInfo.updateOne(
        { postId: productId, name: '_variate' },
        { $set: { value: JSON.stringify(variate) } }
    );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeSalesCollection();
        const collection = await getSalesCollection();
        const sale = await collection.findOne({ _id: new ObjectId(id) });
        if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ sale: { ...sale, _id: sale._id?.toString(), customerId: sale.customerId?.toString() } });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        await initializeSalesCollection();
        const collection = await getSalesCollection();

        const existingSale = await collection.findOne({ _id: new ObjectId(id) });
        if (!existingSale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

        const { _id, cancel, cancelReason, ...updateData } = body;
        updateData.updatedAt = new Date();

        if (cancel && existingSale.status !== 'cancelled') {
            updateData.status = 'cancelled';
            updateData.cancelledAt = new Date();
            updateData.cancelledBy = caller.userId;
            updateData.cancelReason = cancelReason || '';

            for (const item of existingSale.items) {
                const productId = item.productId?.toString();
                const variantId = item.variantId || '';
                if (productId) {
                    await restoreProductStock(productId, variantId, item.quantity);
                }
            }

            if (existingSale.customerId) {
                await initializeCustomersCollection();
                const customersCol = await getCustomersCollection();
                const customer = await customersCol.findOne({ _id: existingSale.customerId });

                if (customer) {
                    const refundAmount = existingSale.walletUsed || 0;
                    const paidAmount = existingSale.paidAmount || 0;
                    const dueAmount = existingSale.dueAmount || 0;

                    const updates: Record<string, any> = {
                        $inc: { totalPurchases: -(existingSale.total || 0), totalPaid: -(paidAmount - dueAmount) },
                        $set: { updatedAt: new Date() },
                    };

                    if (refundAmount > 0) {
                        updates.$inc.walletBalance = refundAmount;
                    }

                    if (dueAmount > 0) {
                        updates.$inc.dueAmount = -dueAmount;
                    }

                    await customersCol.updateOne({ _id: existingSale.customerId }, updates);
                }
            }
        }

        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        return NextResponse.json({ success: true, status: updateData.status || existingSale.status });
    } catch (error) {
        console.error('Sales PUT error:', error);
        return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeSalesCollection();
        const collection = await getSalesCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
    }
}

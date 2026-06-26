import { NextRequest, NextResponse } from 'next/server';
import { getSalesCollection, initializeSalesCollection, generateSaleNumber } from '@/plugin/pos/models/Sale';
import { getCustomersCollection, initializeCustomersCollection } from '@/plugin/pos/models/Customer';
import Post from '@/models/post';
import PostInfo from '@/models/post_info';
import connectDB from '@/lib/mongodb';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

async function updateProductStock(productId: string, variantId: string, quantityChange: number) {
    await connectDB();
    const postInfo = await PostInfo.findOne({ postId: productId, name: '_variate' });
    if (!postInfo) return;

    let variate: any;
    try { variate = JSON.parse(postInfo.value); } catch { return; }

    if (variate.priceType === 'variant' && variantId && variate.variants?.length > 0) {
        const variant = variate.variants.find((v: any) => v.id === variantId);
        if (variant) {
            const currentQty = parseInt(variant.quantity) || 0;
            variant.quantity = String(Math.max(0, currentQty + quantityChange));
        }
    } else {
        const currentStock = parseInt(variate.stock) || 0;
        variate.stock = String(Math.max(0, currentStock + quantityChange));
    }

    await PostInfo.updateOne(
        { postId: productId, name: '_variate' },
        { $set: { value: JSON.stringify(variate) } }
    );
}

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') ?? '';
        const status = searchParams.get('status') ?? '';
        const paymentStatus = searchParams.get('paymentStatus') ?? '';
        const customerId = searchParams.get('customerId') ?? '';
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const skip = (page - 1) * limit;

        await initializeSalesCollection();
        const collection = await getSalesCollection();

        const query: Record<string, any> = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (customerId) query.customerId = new ObjectId(customerId);
        if (search) {
            query.$or = [
                { saleNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
            ];
        }

        const [sales, total] = await Promise.all([
            collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return NextResponse.json({
            sales: sales.map(s => ({ ...s, _id: s._id?.toString(), customerId: s.customerId?.toString() })),
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Sales GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { customerId, customerName, items, subtotal, discount, tax, shipping, total, paidAmount, dueAmount, paymentMethod, notes, status: saleStatus, walletUsed } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
        }

        await initializeSalesCollection();
        const collection = await getSalesCollection();
        const saleNumber = generateSaleNumber();
        const finalStatus = saleStatus || 'completed';
        const actualWalletUsed = walletUsed || 0;

        const sale = {
            saleNumber,
            customerId: customerId ? new ObjectId(customerId) : null,
            customerName: customerName || '',
            items: items.map((item: any) => ({
                ...item,
                productId: new ObjectId(item.productId),
                variantId: item.variantId || '',
                variantLabel: item.variantLabel || '',
            })),
            subtotal: subtotal || 0,
            discount: discount || 0,
            tax: tax || 0,
            shipping: shipping || 0,
            total: total || 0,
            paidAmount: paidAmount || 0,
            walletUsed: actualWalletUsed,
            dueAmount: dueAmount || total || 0,
            status: finalStatus,
            paymentStatus: (paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid') as any,
            paymentMethod: paymentMethod || 'cash',
            notes: notes || '',
            createdBy: caller.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(sale as any);

        if (finalStatus === 'completed') {
            for (const item of items) {
                await updateProductStock(item.productId, item.variantId || '', -(item.quantity));
            }

            if (customerId && actualWalletUsed > 0) {
                await initializeCustomersCollection();
                const customersCol = await getCustomersCollection();
                await customersCol.updateOne(
                    { _id: new ObjectId(customerId) },
                    {
                        $inc: { walletBalance: -actualWalletUsed, totalPurchases: total, totalPaid: paidAmount },
                        $set: { updatedAt: new Date() },
                    }
                );
            } else if (customerId) {
                await initializeCustomersCollection();
                const customersCol = await getCustomersCollection();
                await customersCol.updateOne(
                    { _id: new ObjectId(customerId) },
                    {
                        $inc: { totalPurchases: total, totalPaid: paidAmount },
                        $set: { updatedAt: new Date() },
                    }
                );
            }

            if (customerId && paidAmount > total) {
                const overpay = paidAmount - total;
                await initializeCustomersCollection();
                const customersCol = await getCustomersCollection();
                await customersCol.updateOne(
                    { _id: new ObjectId(customerId) },
                    { $inc: { walletBalance: overpay }, $set: { updatedAt: new Date() } }
                );
            }
        }

        return NextResponse.json({ _id: result.insertedId.toString(), ...sale }, { status: 201 });
    } catch (error) {
        console.error('Sales POST error:', error);
        return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
    }
}

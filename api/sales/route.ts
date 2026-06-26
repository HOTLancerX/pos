import { NextRequest, NextResponse } from 'next/server';
import { getSalesCollection, initializeSalesCollection, generateSaleNumber } from '@/plugin/pos/models/Sale';
import { getInventoryCollection, initializeInventoryCollection } from '@/plugin/pos/models/Inventory';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') ?? '';
        const status = searchParams.get('status') ?? '';
        const paymentStatus = searchParams.get('paymentStatus') ?? '';
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const skip = (page - 1) * limit;

        await initializeSalesCollection();
        const collection = await getSalesCollection();

        const query: Record<string, any> = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
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
            sales: sales.map(s => ({ ...s, _id: s._id?.toString() })),
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { customerId, customerName, items, subtotal, discount, tax, shipping, total, paidAmount, dueAmount, paymentMethod, notes, status: saleStatus } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
        }

        await initializeSalesCollection();
        const collection = await getSalesCollection();

        const finalStatus = saleStatus || 'completed';
        const sale = {
            saleNumber: generateSaleNumber(),
            customerId: customerId || null, customerName: customerName || '',
            items, subtotal: subtotal || 0, discount: discount || 0, tax: tax || 0,
            shipping: shipping || 0, total: total || 0, paidAmount: paidAmount || 0,
            dueAmount: dueAmount || total || 0, status: finalStatus,
            paymentStatus: paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
            paymentMethod: paymentMethod || 'cash', notes: notes || '',
            createdBy: caller.userId, createdAt: new Date(), updatedAt: new Date(),
        };

        const result = await collection.insertOne(sale as any);

        // Update inventory only for completed sales
        if (finalStatus === 'completed') {
            await initializeInventoryCollection();
            const inventoryCol = await getInventoryCollection();
            for (const item of items) {
                await inventoryCol.insertOne({
                    productId: item.productId, type: 'out', quantity: item.quantity,
                    referenceId: result.insertedId.toString(), referenceType: 'sale',
                    note: `Sale #${sale.saleNumber}`, createdBy: caller.userId,
                    createdAt: new Date(),
                } as any);
            }
        }

        return NextResponse.json({ _id: result.insertedId.toString(), ...sale }, { status: 201 });
    } catch (error) {
        console.error('Sales POST error:', error);
        return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
    }
}

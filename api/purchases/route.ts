import { NextRequest, NextResponse } from 'next/server';
import { getPurchasesCollection, initializePurchasesCollection, generatePurchaseNumber } from '@/plugin/pos/models/Purchase';
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

        await initializePurchasesCollection();
        const collection = await getPurchasesCollection();

        const query: Record<string, any> = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (search) {
            query.$or = [
                { purchaseNumber: { $regex: search, $options: 'i' } },
                { supplierName: { $regex: search, $options: 'i' } },
            ];
        }

        const [purchases, total] = await Promise.all([
            collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return NextResponse.json({
            purchases: purchases.map(p => ({ ...p, _id: p._id?.toString() })),
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { supplierId, supplierName, items, subtotal, discount, tax, shipping, total, paidAmount, dueAmount, notes } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
        }

        await initializePurchasesCollection();
        const collection = await getPurchasesCollection();

        const purchase = {
            purchaseNumber: generatePurchaseNumber(),
            supplierId: supplierId || null, supplierName: supplierName || '',
            items, subtotal: subtotal || 0, discount: discount || 0, tax: tax || 0,
            shipping: shipping || 0, total: total || 0, paidAmount: paidAmount || 0,
            dueAmount: dueAmount || total || 0, status: 'pending' as const,
            paymentStatus: paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
            notes: notes || '', createdBy: caller.userId,
            createdAt: new Date(), updatedAt: new Date(),
        };

        const result = await collection.insertOne(purchase as any);

        // Update inventory
        await initializeInventoryCollection();
        const inventoryCol = await getInventoryCollection();
        for (const item of items) {
            await inventoryCol.insertOne({
                productId: item.productId, type: 'in', quantity: item.quantity,
                referenceId: result.insertedId.toString(), referenceType: 'purchase',
                note: `Purchase #${purchase.purchaseNumber}`, createdBy: caller.userId,
                createdAt: new Date(),
            } as any);
        }

        return NextResponse.json({ _id: result.insertedId.toString(), ...purchase }, { status: 201 });
    } catch (error) {
        console.error('Purchases POST error:', error);
        return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
    }
}

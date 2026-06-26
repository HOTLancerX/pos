import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsCollection, initializePaymentsCollection, generatePaymentNumber } from '@/plugin/pos/models/Payment';
import { getSalesCollection, initializeSalesCollection } from '@/plugin/pos/models/Sale';
import { getPurchasesCollection, initializePurchasesCollection } from '@/plugin/pos/models/Purchase';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') ?? '';
        const method = searchParams.get('method') ?? '';
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const skip = (page - 1) * limit;

        await initializePaymentsCollection();
        const collection = await getPaymentsCollection();

        const query: Record<string, any> = {};
        if (type) query.type = type;
        if (method) query.method = method;

        const [payments, total] = await Promise.all([
            collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return NextResponse.json({
            payments: payments.map(p => ({ ...p, _id: p._id?.toString() })),
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { type, referenceId, referenceType, partyId, partyType, partyName, amount, method, bankName, transactionId, notes } = body;

        if (!amount || amount <= 0) return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });

        await initializePaymentsCollection();
        const collection = await getPaymentsCollection();

        const payment = {
            paymentNumber: generatePaymentNumber(), type, referenceId: referenceId || '',
            referenceType: referenceType || '', partyId: partyId || null,
            partyType: partyType || '', partyName: partyName || '',
            amount, method: method || 'cash', bankName: bankName || '',
            transactionId: transactionId || '', notes: notes || '',
            createdBy: caller.userId, createdAt: new Date(),
        };

        const result = await collection.insertOne(payment as any);

        // Update reference payment status
        if (referenceType === 'sale' && referenceId) {
            await initializeSalesCollection();
            const salesCol = await getSalesCollection();
            const sale = await salesCol.findOne({ _id: new ObjectId(referenceId) });
            if (sale) {
                const newPaid = (sale.paidAmount || 0) + amount;
                await salesCol.updateOne({ _id: new ObjectId(referenceId) }, {
                    $set: {
                        paidAmount: newPaid,
                        dueAmount: Math.max(0, (sale.total || 0) - newPaid),
                        paymentStatus: newPaid >= (sale.total || 0) ? 'paid' : 'partial',
                        updatedAt: new Date(),
                    }
                });
            }
        } else if (referenceType === 'purchase' && referenceId) {
            await initializePurchasesCollection();
            const purchasesCol = await getPurchasesCollection();
            const purchase = await purchasesCol.findOne({ _id: new ObjectId(referenceId) });
            if (purchase) {
                const newPaid = (purchase.paidAmount || 0) + amount;
                await purchasesCol.updateOne({ _id: new ObjectId(referenceId) }, {
                    $set: {
                        paidAmount: newPaid,
                        dueAmount: Math.max(0, (purchase.total || 0) - newPaid),
                        paymentStatus: newPaid >= (purchase.total || 0) ? 'paid' : 'partial',
                        updatedAt: new Date(),
                    }
                });
            }
        }

        return NextResponse.json({ _id: result.insertedId.toString(), ...payment }, { status: 201 });
    } catch (error) {
        console.error('Payments POST error:', error);
        return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }
}

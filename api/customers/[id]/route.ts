import { NextRequest, NextResponse } from 'next/server';
import { getCustomersCollection, initializeCustomersCollection } from '@/plugin/pos/models/Customer';
import { getSalesCollection, initializeSalesCollection } from '@/plugin/pos/models/Sale';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const view = searchParams.get('view') ?? 'detail';

        await initializeCustomersCollection();
        const collection = await getCustomersCollection();
        const customer = await collection.findOne({ _id: new ObjectId(id) });
        if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (view === 'history') {
            await initializeSalesCollection();
            const salesCol = await getSalesCollection();
            const sales = await salesCol
                .find({ customerId: new ObjectId(id) })
                .sort({ createdAt: -1 })
                .limit(100)
                .toArray();

            return NextResponse.json({
                customer: { ...customer, _id: customer._id?.toString() },
                sales: sales.map(s => ({ ...s, _id: s._id?.toString(), customerId: s.customerId?.toString() })),
            });
        }

        return NextResponse.json({ customer: { ...customer, _id: customer._id?.toString() } });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        await initializeCustomersCollection();
        const collection = await getCustomersCollection();

        const { _id, walletAdjustment, ...updateData } = body;
        updateData.updatedAt = new Date();

        if (walletAdjustment !== undefined && typeof walletAdjustment === 'number') {
            const customer = await collection.findOne({ _id: new ObjectId(id) });
            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
            const newBalance = (customer.walletBalance || 0) + walletAdjustment;
            updateData.walletBalance = Math.max(0, newBalance);
        }

        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeCustomersCollection();
        const collection = await getCustomersCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
}

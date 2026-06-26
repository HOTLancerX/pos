import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsCollection, initializePaymentsCollection } from '@/plugin/pos/models/Payment';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializePaymentsCollection();
        const collection = await getPaymentsCollection();
        const payment = await collection.findOne({ _id: new ObjectId(id) });
        if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ ...payment, _id: payment._id?.toString() });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializePaymentsCollection();
        const collection = await getPaymentsCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
    }
}

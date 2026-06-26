import { NextRequest, NextResponse } from 'next/server';
import { getExpensesCollection, initializeExpensesCollection } from '@/plugin/pos/models/Expense';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeExpensesCollection();
        const collection = await getExpensesCollection();
        const expense = await collection.findOne({ _id: new ObjectId(id) });
        if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ ...expense, _id: expense._id?.toString() });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        await initializeExpensesCollection();
        const collection = await getExpensesCollection();
        const { _id, ...updateData } = body;
        updateData.updatedAt = new Date();
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeExpensesCollection();
        const collection = await getExpensesCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}

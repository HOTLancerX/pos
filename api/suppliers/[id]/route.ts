import { NextRequest, NextResponse } from 'next/server';
import { getSuppliersCollection, initializeSuppliersCollection } from '@/plugin/pos/models/Supplier';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeSuppliersCollection();
        const collection = await getSuppliersCollection();
        const supplier = await collection.findOne({ _id: new ObjectId(id) });
        if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ ...supplier, _id: supplier._id?.toString() });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        await initializeSuppliersCollection();
        const collection = await getSuppliersCollection();

        const { _id, ...updateData } = body;
        updateData.updatedAt = new Date();

        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeSuppliersCollection();
        const collection = await getSuppliersCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
    }
}

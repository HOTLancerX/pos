import { NextRequest, NextResponse } from 'next/server';
import { getProductsCollection, initializeProductsCollection } from '@/plugin/pos/models/Product';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeProductsCollection();
        const collection = await getProductsCollection();
        const product = await collection.findOne({ _id: new ObjectId(id) });
        if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ ...product, _id: product._id?.toString() });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        await initializeProductsCollection();
        const collection = await getProductsCollection();
        const { _id, ...updateData } = body;
        updateData.updatedAt = new Date();
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeProductsCollection();
        const collection = await getProductsCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}

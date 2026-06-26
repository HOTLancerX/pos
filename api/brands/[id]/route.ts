import { NextRequest, NextResponse } from 'next/server';
import { getBrandsCollection, initializeBrandsCollection } from '@/plugin/pos/models/Brand';
import { resolveUser } from '@/lib/session';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeBrandsCollection();
        const collection = await getBrandsCollection();
        const brand = await collection.findOne({ _id: new ObjectId(id) });
        if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ ...brand, _id: brand._id?.toString() });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        await initializeBrandsCollection();
        const collection = await getBrandsCollection();
        const { _id, ...updateData } = body;
        updateData.updatedAt = new Date();
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        await initializeBrandsCollection();
        const collection = await getBrandsCollection();
        await collection.deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getBrandsCollection, initializeBrandsCollection } from '@/plugin/pos/models/Brand';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') ?? '';
        const status = searchParams.get('status') ?? '';

        await initializeBrandsCollection();
        const collection = await getBrandsCollection();

        const query: Record<string, any> = {};
        if (status) query.status = status;
        if (search) query.name = { $regex: search, $options: 'i' };

        const brands = await collection.find(query).sort({ name: 1 }).toArray();
        return NextResponse.json({ brands: brands.map(b => ({ ...b, _id: b._id?.toString() })) });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, description, logo } = body;
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        await initializeBrandsCollection();
        const collection = await getBrandsCollection();

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existing = await collection.findOne({ slug });
        if (existing) return NextResponse.json({ error: 'Brand already exists' }, { status: 409 });

        const brand = {
            name, slug, description: description || '', logo: logo || '',
            status: 'active' as const, createdAt: new Date(), updatedAt: new Date(),
        };

        const result = await collection.insertOne(brand as any);
        return NextResponse.json({ _id: result.insertedId.toString(), ...brand }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }
}

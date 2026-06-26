import { NextRequest, NextResponse } from 'next/server';
import { getUnitsCollection, initializeUnitsCollection } from '@/plugin/pos/models/Unit';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') ?? '';
        const status = searchParams.get('status') ?? '';

        await initializeUnitsCollection();
        const collection = await getUnitsCollection();

        const query: Record<string, any> = {};
        if (status) query.status = status;
        if (search) query.name = { $regex: search, $options: 'i' };

        const units = await collection.find(query).sort({ name: 1 }).toArray();
        return NextResponse.json({ units: units.map(u => ({ ...u, _id: u._id?.toString() })) });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, shortName, baseUnit, conversionFactor } = body;
        if (!name || !shortName) return NextResponse.json({ error: 'Name and short name are required' }, { status: 400 });

        await initializeUnitsCollection();
        const collection = await getUnitsCollection();

        const existing = await collection.findOne({ name });
        if (existing) return NextResponse.json({ error: 'Unit already exists' }, { status: 409 });

        const unit = {
            name, shortName, baseUnit: baseUnit || '', conversionFactor: conversionFactor || 1,
            status: 'active' as const, createdAt: new Date(), updatedAt: new Date(),
        };

        const result = await collection.insertOne(unit as any);
        return NextResponse.json({ _id: result.insertedId.toString(), ...unit }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 });
    }
}

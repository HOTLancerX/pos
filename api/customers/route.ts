import { NextRequest, NextResponse } from 'next/server';
import { getCustomersCollection, initializeCustomersCollection } from '@/plugin/pos/models/Customer';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') ?? '';
        const status = searchParams.get('status') ?? '';
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
        const skip = (page - 1) * limit;

        await initializeCustomersCollection();
        const collection = await getCustomersCollection();

        const query: Record<string, any> = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        const [customers, total] = await Promise.all([
            collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return NextResponse.json({
            customers: customers.map(c => ({ ...c, _id: c._id?.toString() })),
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Customers GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, email, phone, address, city, state, zipCode, taxNumber, notes } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
        }

        await initializeCustomersCollection();
        const collection = await getCustomersCollection();

        const existing = await collection.findOne({ phone });
        if (existing) {
            return NextResponse.json({ error: 'Phone number already exists' }, { status: 409 });
        }

        const customer = {
            name, email: email || '', phone, address: address || '', city: city || '',
            state: state || '', zipCode: zipCode || '', taxNumber: taxNumber || '',
            notes: notes || '', status: 'active' as const, dueAmount: 0,
            createdAt: new Date(), updatedAt: new Date(),
        };

        const result = await collection.insertOne(customer as any);
        return NextResponse.json({ _id: result.insertedId.toString(), ...customer }, { status: 201 });
    } catch (error) {
        console.error('Customers POST error:', error);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}

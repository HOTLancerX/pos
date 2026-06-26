import { NextRequest, NextResponse } from 'next/server';
import { getInventoryCollection, initializeInventoryCollection } from '@/plugin/pos/models/Inventory';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') ?? '';
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const skip = (page - 1) * limit;

        await initializeInventoryCollection();
        const collection = await getInventoryCollection();

        const query: Record<string, any> = {};
        if (type) query.type = type;

        const [items, total] = await Promise.all([
            collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return NextResponse.json({
            items: items.map(i => ({ ...i, _id: i._id?.toString() })),
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Inventory GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

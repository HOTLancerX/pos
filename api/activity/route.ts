import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogsCollection, initializeActivityLogsCollection } from '@/plugin/pos/models/ActivityLog';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') ?? '';
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
        const skip = (page - 1) * limit;

        await initializeActivityLogsCollection();
        const collection = await getActivityLogsCollection();

        const query: Record<string, any> = {};
        if (type) query.type = type;

        const [logs, total] = await Promise.all([
            collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return NextResponse.json({
            logs: logs.map(l => ({ ...l, _id: l._id?.toString() })),
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}

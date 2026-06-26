import { NextRequest, NextResponse } from 'next/server';
import { getIncomeCollection, initializeIncomeCollection } from '@/plugin/pos/models/Income';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('categoryId') ?? '';
        const startDate = searchParams.get('startDate') ?? '';
        const endDate = searchParams.get('endDate') ?? '';
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
        const skip = (page - 1) * limit;

        await initializeIncomeCollection();
        const collection = await getIncomeCollection();

        const query: Record<string, any> = {};
        if (categoryId) query.categoryId = categoryId;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
        }

        const [incomes, total] = await Promise.all([
            collection.find(query).sort({ date: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return NextResponse.json({
            incomes: incomes.map(i => ({ ...i, _id: i._id?.toString() })),
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { categoryId, categoryName, amount, date, description, reference, attachment } = body;

        if (!amount || amount <= 0) return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });

        await initializeIncomeCollection();
        const collection = await getIncomeCollection();

        const income = {
            categoryId: categoryId || null, categoryName: categoryName || '',
            amount, date: date ? new Date(date) : new Date(),
            description: description || '', reference: reference || '',
            attachment: attachment || '', createdBy: caller.userId,
            createdAt: new Date(), updatedAt: new Date(),
        };

        const result = await collection.insertOne(income as any);
        return NextResponse.json({ _id: result.insertedId.toString(), ...income }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create income' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import Cat from '@/models/cat';
import CatInfo from '@/models/cat_info';
import connectDB from '@/lib/mongodb';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') ?? '';
        const status = searchParams.get('status') ?? 'published';

        await connectDB();

        const query: Record<string, any> = { type: 'product-category' };
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const cats = await Cat.find(query).sort({ title: 1 }).lean();

        const catIds = cats.map(c => c._id);
        const allInfo = await CatInfo.find({ catId: { $in: catIds } }).lean();

        const infoMap: Record<string, Record<string, string>> = {};
        for (const info of allInfo) {
            const cid = info.catId?.toString();
            if (!infoMap[cid]) infoMap[cid] = {};
            infoMap[cid][info.name] = info.value;
        }

        const categories = cats.map(cat => {
            const cid = cat._id?.toString();
            const info = infoMap[cid] || {};
            return {
                _id: cid,
                title: cat.title,
                slug: cat.slug,
                description: '',
                image: info['cat_image'] || '',
                icon: info['cat_icon'] || '',
                featured: info['cat_featured'] === 'true',
                parentId: cat.parentId?.toString() || null,
                status: cat.status,
                createdAt: cat.createdAt,
            };
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('POS Categories GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

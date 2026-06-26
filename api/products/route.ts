import { NextRequest, NextResponse } from 'next/server';
import Post from '@/models/post';
import PostInfo from '@/models/post_info';
import Cat from '@/models/cat';
import connectDB from '@/lib/mongodb';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') ?? '';
        const barcode = searchParams.get('barcode') ?? '';
        const categoryId = searchParams.get('categoryId') ?? '';
        const status = searchParams.get('status') ?? 'published';
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
        const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
        const skip = (page - 1) * limit;

        await connectDB();

        const query: Record<string, any> = { type: 'product' };
        if (status) query.status = status;
        if (categoryId) query.category = categoryId;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
            ];
        }

        const [posts, total] = await Promise.all([
            Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Post.countDocuments(query),
        ]);

        const postIds = posts.map(p => p._id);
        const allInfo = await PostInfo.find({ postId: { $in: postIds } }).lean();

        const infoMap: Record<string, Record<string, string>> = {};
        for (const info of allInfo) {
            const pid = info.postId?.toString();
            if (!infoMap[pid]) infoMap[pid] = {};
            infoMap[pid][info.name] = info.value;
        }

        const cats = await Cat.find({ type: 'product-category', status: 'published' }).lean();
        const catMap: Record<string, string> = {};
        for (const cat of cats) {
            catMap[cat._id.toString()] = cat.title;
        }

        const products = posts.map(post => {
            const pid = post._id?.toString();
            const info = infoMap[pid] || {};

            let regularprice = 0;
            let sellingprice = 0;
            let stock = 0;
            let barcodeVal = '';
            let priceType = 'single';
            let variants: any[] = [];
            try {
                const variate = JSON.parse(info['_variate'] || '{}');
                priceType = variate.priceType || 'single';
                regularprice = parseFloat(variate.regularprice) || 0;
                sellingprice = parseFloat(variate.sellingprice) || 0;
                stock = parseInt(variate.stock) || 0;
                variants = variate.variants || [];
                if (priceType === 'single' && variants.length > 0) {
                    barcodeVal = variants[0]?.barcode || '';
                }
            } catch {}

            let images: string[] = [];
            try {
                const parsed = JSON.parse(info['images'] || '[]');
                if (Array.isArray(parsed)) images = parsed;
            } catch {}

            return {
                _id: pid,
                title: post.title,
                slug: post.slug,
                type: post.type,
                status: post.status,
                categoryId: post.category?.toString() || '',
                categoryName: catMap[post.category?.toString()] || '',
                barcode: barcodeVal || info['sku'] || '',
                sku: info['sku'] || '',
                regularprice,
                sellingprice,
                stock,
                priceType,
                variants,
                images,
                image: images[0] || '',
                condition: info['product_condition'] || '',
                shortDescription: info['shortDescription'] || '',
                createdAt: post.createdAt,
            };
        });

        let filtered = products;
        if (barcode) {
            filtered = products.filter(p => p.barcode === barcode || p.sku === barcode);
        }

        return NextResponse.json({
            products: filtered,
            total, page, limit, pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('POS Products GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

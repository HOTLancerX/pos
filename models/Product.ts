import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface PosProduct {
    _id?: ObjectId;
    name: string;
    slug: string;
    barcode: string;
    sku: string;
    categoryId: ObjectId | null;
    categoryName: string;
    brandId: ObjectId | null;
    brandName: string;
    unitId: ObjectId | null;
    unitName: string;
    description: string;
    costPrice: number;
    sellingPrice: number;
    wholesalePrice: number;
    taxRate: number;
    taxType: 'inclusive' | 'exclusive';
    discountType: 'fixed' | 'percentage';
    discountValue: number;
    stock: number;
    minStock: number;
    maxStock: number;
    images: { url: string; alt: string; isPrimary: boolean }[];
    status: 'active' | 'inactive';
    isService: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const COLLECTION_NAME = 'pos_products';

export async function getProductsCollection(): Promise<Collection<PosProduct>> {
    return getCollection<PosProduct>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeProductsCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getProductsCollection();
        let existingIndexes;
        try {
            existingIndexes = await collection.indexes();
        } catch (error: any) {
            if (error.code === 26 || error.codeName === 'NamespaceNotFound') {
                indexesCreated = true;
                return;
            }
            throw error;
        }
        const indexNames = existingIndexes.map(idx => idx.name);
        if (!indexNames.includes('slug_1')) {
            await collection.createIndex({ slug: 1 }, { unique: true });
            await collection.createIndex({ barcode: 1 }, { sparse: true });
            await collection.createIndex({ sku: 1 }, { sparse: true });
            await collection.createIndex({ categoryId: 1 });
            await collection.createIndex({ status: 1 });
            await collection.createIndex({ name: 'text', barcode: 'text', sku: 'text' });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating POS products indexes:', error);
    }
}

export function generateBarcode(): string {
    return Date.now().toString() + Math.random().toString().substring(2, 8);
}

export function generateProductSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}

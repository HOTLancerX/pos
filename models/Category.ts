import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface PosCategory {
    _id?: ObjectId;
    name: string;
    slug: string;
    description: string;
    image: string;
    parentId: ObjectId | null;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

export const COLLECTION_NAME = 'pos_categories';

export async function getCategoriesCollection(): Promise<Collection<PosCategory>> {
    return getCollection<PosCategory>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeCategoriesCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getCategoriesCollection();
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
            await collection.createIndex({ parentId: 1 });
            await collection.createIndex({ status: 1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating POS categories indexes:', error);
    }
}

export function generateCategorySlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

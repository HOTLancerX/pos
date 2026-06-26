import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface PosBrand {
    _id?: ObjectId;
    name: string;
    slug: string;
    description: string;
    logo: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

export const COLLECTION_NAME = 'pos_brands';

export async function getBrandsCollection(): Promise<Collection<PosBrand>> {
    return getCollection<PosBrand>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeBrandsCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getBrandsCollection();
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
            await collection.createIndex({ name: 1 });
            await collection.createIndex({ status: 1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating brands indexes:', error);
    }
}

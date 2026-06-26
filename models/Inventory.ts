import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface InventoryRecord {
    _id?: ObjectId;
    productId: ObjectId;
    type: 'in' | 'out' | 'adjustment' | 'damage';
    quantity: number;
    referenceId: string;
    referenceType: string;
    note: string;
    createdBy: string;
    createdAt: Date;
}

export const COLLECTION_NAME = 'pos_inventory';

export async function getInventoryCollection(): Promise<Collection<InventoryRecord>> {
    return getCollection<InventoryRecord>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeInventoryCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getInventoryCollection();
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
        if (!indexNames.includes('productId_1')) {
            await collection.createIndex({ productId: 1 });
            await collection.createIndex({ type: 1 });
            await collection.createIndex({ createdAt: -1 });
            await collection.createIndex({ referenceId: 1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating inventory indexes:', error);
    }
}

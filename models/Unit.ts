import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface PosUnit {
    _id?: ObjectId;
    name: string;
    shortName: string;
    baseUnit: string;
    conversionFactor: number;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

export const COLLECTION_NAME = 'pos_units';

export async function getUnitsCollection(): Promise<Collection<PosUnit>> {
    return getCollection<PosUnit>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeUnitsCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getUnitsCollection();
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
        if (!indexNames.includes('name_1')) {
            await collection.createIndex({ name: 1 }, { unique: true });
            await collection.createIndex({ status: 1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating units indexes:', error);
    }
}

import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface Income {
    _id?: ObjectId;
    categoryId: ObjectId | null;
    categoryName: string;
    amount: number;
    date: Date;
    description: string;
    reference: string;
    attachment: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const COLLECTION_NAME = 'pos_income';

export async function getIncomeCollection(): Promise<Collection<Income>> {
    return getCollection<Income>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeIncomeCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getIncomeCollection();
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
        if (!indexNames.includes('date_1')) {
            await collection.createIndex({ categoryId: 1 });
            await collection.createIndex({ date: -1 });
            await collection.createIndex({ createdBy: 1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating income indexes:', error);
    }
}
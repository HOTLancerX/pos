import { Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface ActivityLog {
    _id?: string;
    action: 'create' | 'update' | 'delete';
    type: string;
    referenceId: string;
    description: string;
    createdBy: string;
    createdByName: string;
    createdAt: Date;
}

export const COLLECTION_NAME = 'pos_activity_logs';

export async function getActivityLogsCollection(): Promise<Collection<ActivityLog>> {
    return getCollection<ActivityLog>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeActivityLogsCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getActivityLogsCollection();
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
        if (!indexNames.includes('type_1')) {
            await collection.createIndex({ type: 1 });
            await collection.createIndex({ referenceId: 1 });
            await collection.createIndex({ createdBy: 1 });
            await collection.createIndex({ createdAt: -1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating activity logs indexes:', error);
    }
}

export async function logActivity(data: Omit<ActivityLog, '_id' | 'createdAt'>): Promise<void> {
    const collection = await getActivityLogsCollection();
    await collection.insertOne({
        ...data,
        createdAt: new Date(),
    } as ActivityLog);
}

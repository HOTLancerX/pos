import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface Customer {
    _id?: ObjectId;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    taxNumber: string;
    notes: string;
    status: 'active' | 'inactive';
    dueAmount: number;
    walletBalance: number;
    totalPurchases: number;
    totalPaid: number;
    createdAt: Date;
    updatedAt: Date;
}

export const COLLECTION_NAME = 'pos_customers';

export async function getCustomersCollection(): Promise<Collection<Customer>> {
    return getCollection<Customer>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeCustomersCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getCustomersCollection();
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
        if (!indexNames.includes('phone_1')) {
            await collection.createIndex({ phone: 1 }, { unique: true });
            await collection.createIndex({ email: 1 });
            await collection.createIndex({ name: 1 });
            await collection.createIndex({ status: 1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating customers indexes:', error);
    }
}

export function generateCustomerCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CUST-${timestamp}-${random}`;
}

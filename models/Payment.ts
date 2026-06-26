import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface Payment {
    _id?: ObjectId;
    paymentNumber: string;
    type: 'receivable' | 'payable';
    referenceId: string;
    referenceType: 'sale' | 'purchase';
    partyId: ObjectId | null;
    partyType: 'customer' | 'supplier';
    partyName: string;
    amount: number;
    method: 'cash' | 'bank' | 'mobile' | 'card';
    bankName: string;
    transactionId: string;
    notes: string;
    createdBy: string;
    createdAt: Date;
}

export const COLLECTION_NAME = 'pos_payments';

export async function getPaymentsCollection(): Promise<Collection<Payment>> {
    return getCollection<Payment>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializePaymentsCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getPaymentsCollection();
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
        if (!indexNames.includes('paymentNumber_1')) {
            await collection.createIndex({ paymentNumber: 1 }, { unique: true });
            await collection.createIndex({ referenceId: 1 });
            await collection.createIndex({ partyId: 1 });
            await collection.createIndex({ type: 1 });
            await collection.createIndex({ createdAt: -1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating payments indexes:', error);
    }
}

export function generatePaymentNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${timestamp}-${random}`;
}
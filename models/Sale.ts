import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface SaleItem {
    productId: ObjectId;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    subtotal: number;
}

export interface Sale {
    _id?: ObjectId;
    saleNumber: string;
    customerId: ObjectId | null;
    customerName: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    paidAmount: number;
    dueAmount: number;
    status: 'completed' | 'pending' | 'cancelled' | 'held' | 'draft';
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentMethod: string;
    notes: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const COLLECTION_NAME = 'pos_sales';

export async function getSalesCollection(): Promise<Collection<Sale>> {
    return getCollection<Sale>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializeSalesCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getSalesCollection();
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
        if (!indexNames.includes('saleNumber_1')) {
            await collection.createIndex({ saleNumber: 1 }, { unique: true });
            await collection.createIndex({ customerId: 1 });
            await collection.createIndex({ status: 1 });
            await collection.createIndex({ paymentStatus: 1 });
            await collection.createIndex({ createdAt: -1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating sales indexes:', error);
    }
}

export function generateSaleNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SLR-${timestamp}-${random}`;
}

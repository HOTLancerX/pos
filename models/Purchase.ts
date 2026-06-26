import { ObjectId, Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface PurchaseItem {
    productId: ObjectId;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    subtotal: number;
}

export interface Purchase {
    _id?: ObjectId;
    purchaseNumber: string;
    supplierId: ObjectId | null;
    supplierName: string;
    items: PurchaseItem[];
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    paidAmount: number;
    dueAmount: number;
    status: 'pending' | 'received' | 'cancelled';
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    notes: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const COLLECTION_NAME = 'pos_purchases';

export async function getPurchasesCollection(): Promise<Collection<Purchase>> {
    return getCollection<Purchase>(COLLECTION_NAME);
}

let indexesCreated = false;
export async function initializePurchasesCollection() {
    if (indexesCreated) return;
    try {
        const collection = await getPurchasesCollection();
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
        if (!indexNames.includes('purchaseNumber_1')) {
            await collection.createIndex({ purchaseNumber: 1 }, { unique: true });
            await collection.createIndex({ supplierId: 1 });
            await collection.createIndex({ status: 1 });
            await collection.createIndex({ paymentStatus: 1 });
            await collection.createIndex({ createdAt: -1 });
        }
        indexesCreated = true;
    } catch (error) {
        console.error('Error creating purchases indexes:', error);
    }
}

export function generatePurchaseNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PUR-${timestamp}-${random}`;
}

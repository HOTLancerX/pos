import { Collection } from 'mongodb';
import { getCollection } from '@/lib/mongodb';

export interface CompanySettings {
    _id?: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    companyLogo: string;
    currency: string;
    currencySymbol: string;
    taxRate: number;
    taxType: 'inclusive' | 'exclusive';
    invoicePrefix: string;
    invoiceFooter: string;
    receiptWidth: '58mm' | '80mm';
    lowStockThreshold: number;
    dateFormat: string;
    timezone: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const COLLECTION_NAME = 'pos_settings';

export async function getSettingsCollection(): Promise<Collection<CompanySettings>> {
    return getCollection<CompanySettings>(COLLECTION_NAME);
}

export async function getSettings(): Promise<CompanySettings> {
    const collection = await getSettingsCollection();
    const settings = await collection.findOne({ _id: 'pos_settings' });
    return settings || {
        _id: 'pos_settings',
        companyName: '',
        companyEmail: '',
        companyPhone: '',
        companyAddress: '',
        companyLogo: '',
        currency: 'BDT',
        currencySymbol: '৳',
        taxRate: 0,
        taxType: 'exclusive',
        invoicePrefix: 'INV',
        invoiceFooter: 'Thank you for your purchase!',
        receiptWidth: '80mm',
        lowStockThreshold: 10,
        dateFormat: 'YYYY-MM-DD',
        timezone: 'Asia/Dhaka',
    };
}

export async function updateSettings(data: Partial<CompanySettings>): Promise<void> {
    const collection = await getSettingsCollection();
    await collection.updateOne(
        { _id: 'pos_settings' },
        { $set: { ...data, updatedAt: new Date() } },
        { upsert: true }
    );
}

import { NextRequest, NextResponse } from 'next/server';
import { getSalesCollection, initializeSalesCollection } from '@/plugin/pos/models/Sale';
import { getPurchasesCollection, initializePurchasesCollection } from '@/plugin/pos/models/Purchase';
import { getExpensesCollection, initializeExpensesCollection } from '@/plugin/pos/models/Expense';
import { getIncomeCollection, initializeIncomeCollection } from '@/plugin/pos/models/Income';
import { getCustomersCollection, initializeCustomersCollection } from '@/plugin/pos/models/Customer';
import { getSuppliersCollection, initializeSuppliersCollection } from '@/plugin/pos/models/Supplier';
import { getInventoryCollection, initializeInventoryCollection } from '@/plugin/pos/models/Inventory';
import { resolveUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const caller = await resolveUser(req);
        if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') ?? 'daily';
        const startDate = searchParams.get('startDate') ?? '';
        const endDate = searchParams.get('endDate') ?? '';

        const now = new Date();
        let start: Date;
        let end: Date = now;

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate + 'T23:59:59.999Z');
        } else if (type === 'daily') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (type === 'weekly') {
            start = new Date(now);
            start.setDate(start.getDate() - 7);
        } else if (type === 'monthly') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (type === 'yearly') {
            start = new Date(now.getFullYear(), 0, 1);
        } else {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }

        const dateQuery = { $gte: start, $lte: end };

        await Promise.all([
            initializeSalesCollection(), initializePurchasesCollection(),
            initializeExpensesCollection(), initializeIncomeCollection(),
            initializeCustomersCollection(), initializeSuppliersCollection(),
            initializeInventoryCollection(),
        ]);

        const [salesCol, purchasesCol, expensesCol, incomeCol, customersCol, suppliersCol, inventoryCol] = await Promise.all([
            getSalesCollection(), getPurchasesCollection(), getExpensesCollection(),
            getIncomeCollection(), getCustomersCollection(), getSuppliersCollection(),
            getInventoryCollection(),
        ]);

        const [
            salesData, purchaseData, expenseData, incomeData,
            totalCustomers, totalSuppliers, lowStockProducts,
        ] = await Promise.all([
            salesCol.aggregate([
                { $match: { createdAt: dateQuery, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 }, paid: { $sum: '$paidAmount' }, due: { $sum: '$dueAmount' } } }
            ]).toArray(),
            purchasesCol.aggregate([
                { $match: { createdAt: dateQuery } },
                { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 }, paid: { $sum: '$paidAmount' }, due: { $sum: '$dueAmount' } } }
            ]).toArray(),
            expensesCol.aggregate([
                { $match: { date: dateQuery } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]).toArray(),
            incomeCol.aggregate([
                { $match: { date: dateQuery } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]).toArray(),
            customersCol.countDocuments({}),
            suppliersCol.countDocuments({}),
            inventoryCol.countDocuments({ type: 'out' }),
        ]);

        const sales = salesData[0] || { total: 0, count: 0, paid: 0, due: 0 };
        const purchases = purchaseData[0] || { total: 0, count: 0, paid: 0, due: 0 };
        const expenses = expenseData[0] || { total: 0, count: 0 };
        const income = incomeData[0] || { total: 0, count: 0 };

        return NextResponse.json({
            period: { type, start, end },
            sales: { total: sales.total, count: sales.count, paid: sales.paid, due: sales.due },
            purchases: { total: purchases.total, count: purchases.count, paid: purchases.paid, due: purchases.due },
            expenses: { total: expenses.total, count: expenses.count },
            income: { total: income.total, count: income.count },
            profit: sales.total - purchases.total - expenses.total + income.total,
            totals: { customers: totalCustomers, suppliers: totalSuppliers },
        });
    } catch (error) {
        console.error('Reports GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}

"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface DashboardData {
    period: { type: string; start: string; end: string };
    sales: { total: number; count: number; paid: number; due: number };
    purchases: { total: number; count: number; paid: number; due: number };
    expenses: { total: number; count: number };
    income: { total: number; count: number };
    profit: number;
    totals: { customers: number; suppliers: number };
}

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/pos/reports?type=daily")
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(setData)
            .catch(() => setData({
                period: { type: "daily", start: "", end: "" },
                sales: { total: 0, count: 0, paid: 0, due: 0 },
                purchases: { total: 0, count: 0, paid: 0, due: 0 },
                expenses: { total: 0, count: 0 },
                income: { total: 0, count: 0 },
                profit: 0,
                totals: { customers: 0, suppliers: 0 },
            }))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" />
            </div>
        );
    }

    if (!data) return null;

    const fmt = (n: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(n);

    const cards = [
        { label: "Today's Sales", value: fmt(data.sales.total), icon: "solar:cart-large-bold", color: "from-emerald-500 to-teal-600", count: `${data.sales.count} orders` },
        { label: "Today's Purchases", value: fmt(data.purchases.total), icon: "solar:shop-bold", color: "from-blue-500 to-indigo-600", count: `${data.purchases.count} orders` },
        { label: "Today's Gains", value: fmt(data.profit), icon: "solar:chart-bold", color: "from-violet-500 to-purple-600", count: "Net profit" },
        { label: "Outstanding", value: fmt(data.sales.due + data.purchases.due), icon: "solar:clock-circle-bold", color: "from-amber-500 to-orange-600", count: "Due amount" },
        { label: "Total Customers", value: data.totals.customers.toString(), icon: "solar:users-group-bold", color: "from-pink-500 to-rose-600", count: "Active" },
        { label: "Total Suppliers", value: data.totals.suppliers.toString(), icon: "solar:delivery-bold", color: "from-cyan-500 to-sky-600", count: "Active" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">POS Dashboard</h1>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Daily</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                                <p className="text-xs text-gray-400 mt-1">{card.count}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${card.color} flex items-center justify-center`}>
                                <Icon icon={card.icon} width={24} className="text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales vs Purchases</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Sales</span>
                            <div className="flex-1 mx-4 bg-gray-100 rounded-full h-3">
                                <div className="bg-linear-to-r from-emerald-500 to-teal-600 h-3 rounded-full" style={{ width: "70%" }} />
                            </div>
                            <span className="text-sm font-medium">{fmt(data.sales.total)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Purchases</span>
                            <div className="flex-1 mx-4 bg-gray-100 rounded-full h-3">
                                <div className="bg-linear-to-r from-blue-500 to-indigo-600 h-3 rounded-full" style={{ width: "50%" }} />
                            </div>
                            <span className="text-sm font-medium">{fmt(data.purchases.total)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Expenses</span>
                            <div className="flex-1 mx-4 bg-gray-100 rounded-full h-3">
                                <div className="bg-linear-to-r from-red-500 to-rose-600 h-3 rounded-full" style={{ width: "30%" }} />
                            </div>
                            <span className="text-sm font-medium">{fmt(data.expenses.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <a href="/admin/pos/sales/new" className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors">
                            <Icon icon="solar:cart-large-bold" width={20} className="text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">New Sale</span>
                        </a>
                        <a href="/admin/pos/purchases/new" className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                            <Icon icon="solar:shop-bold" width={20} className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">New Purchase</span>
                        </a>
                        <a href="/admin/pos/customers" className="flex items-center gap-3 p-3 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors">
                            <Icon icon="solar:users-group-bold" width={20} className="text-pink-600" />
                            <span className="text-sm font-medium text-pink-700">Customers</span>
                        </a>
                        <a href="/admin/pos/inventory" className="flex items-center gap-3 p-3 rounded-lg bg-violet-50 hover:bg-violet-100 transition-colors">
                            <Icon icon="solar:box-bold" width={20} className="text-violet-600" />
                            <span className="text-sm font-medium text-violet-700">Inventory</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

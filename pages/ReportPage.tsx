"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface ReportData {
    period: { type: string; start: string; end: string };
    sales: { total: number; count: number; paid: number; due: number };
    purchases: { total: number; count: number; paid: number; due: number };
    expenses: { total: number; count: number };
    income: { total: number; count: number };
    profit: number;
    totals: { customers: number; suppliers: number };
}

export default function ReportPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("daily");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchReport = () => {
        setLoading(true);
        const params = new URLSearchParams({ type: period });
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        fetch(`/api/pos/reports?${params}`)
            .then((r) => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReport(); }, [period]);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" /></div>;
    }

    if (!data) return <div className="text-center text-gray-500 py-8">Failed to load report</div>;

    const fmt = (n: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(n);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                <button onClick={fetchReport} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">Apply</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Icon icon="solar:cart-large-bold" width={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Sales</p>
                            <p className="text-xl font-bold text-gray-900">{fmt(data.sales.total)}</p>
                            <p className="text-xs text-gray-400">{data.sales.count} orders</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Icon icon="solar:shop-bold" width={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Purchases</p>
                            <p className="text-xl font-bold text-gray-900">{fmt(data.purchases.total)}</p>
                            <p className="text-xs text-gray-400">{data.purchases.count} orders</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <Icon icon="solar:money-bold" width={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Expenses</p>
                            <p className="text-xl font-bold text-gray-900">{fmt(data.expenses.total)}</p>
                            <p className="text-xs text-gray-400">{data.expenses.count} entries</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${data.profit >= 0 ? "from-green-500 to-emerald-600" : "from-red-500 to-rose-600"} flex items-center justify-center`}>
                            <Icon icon="solar:chart-bold" width={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Net Profit</p>
                            <p className={`text-xl font-bold ${data.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(data.profit)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Total Sales</span><span className="text-sm font-medium">{fmt(data.sales.total)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Paid Amount</span><span className="text-sm font-medium text-green-600">{fmt(data.sales.paid)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Due Amount</span><span className="text-sm font-medium text-red-600">{fmt(data.sales.due)}</span></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Total Purchases</span><span className="text-sm font-medium">{fmt(data.purchases.total)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Paid Amount</span><span className="text-sm font-medium text-green-600">{fmt(data.purchases.paid)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Due Amount</span><span className="text-sm font-medium text-red-600">{fmt(data.purchases.due)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

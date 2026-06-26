"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Sale {
    _id: string;
    saleNumber: string;
    customerName: string;
    total: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
}

export default function SaleList() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchSales = () => {
        setLoading(true);
        fetch(`/api/pos/sales?search=${search}&status=${statusFilter}&page=${page}&limit=20`)
            .then((r) => r.json())
            .then((d) => { setSales(d.sales || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSales(); }, [search, statusFilter, page]);

    const statusColors: Record<string, string> = {
        completed: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        cancelled: "bg-red-100 text-red-700",
        held: "bg-blue-100 text-blue-700",
        draft: "bg-gray-100 text-gray-700",
    };

    const paymentColors: Record<string, string> = {
        unpaid: "bg-red-100 text-red-700",
        partial: "bg-yellow-100 text-yellow-700",
        paid: "bg-green-100 text-green-700",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
                <a href="/admin/pos/sales/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:shop-bold" width={18} /> New Sale (POS)
                </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Search sales..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="held">Held</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Sale #</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Paid</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Due</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">No sales found</td></tr>
                        ) : sales.map((s) => (
                            <tr key={s._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-emerald-600">{s.saleNumber}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{s.customerName || "Walk-in"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.total?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-green-600">{s.paidAmount?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-red-600">{s.dueAmount?.toFixed(2)}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${statusColors[s.status] || ""}`}>{s.status}</span></td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${paymentColors[s.paymentStatus] || ""}`}>{s.paymentStatus}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50">Prev</button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
}

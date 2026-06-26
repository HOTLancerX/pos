"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Purchase {
    _id: string;
    purchaseNumber: string;
    supplierName: string;
    total: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
}

export default function PurchaseList() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPurchases = () => {
        setLoading(true);
        fetch(`/api/pos/purchases?search=${search}&status=${statusFilter}&page=${page}&limit=20`)
            .then((r) => r.json())
            .then((d) => { setPurchases(d.purchases || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPurchases(); }, [search, statusFilter, page]);

    const statusColors: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-700",
        received: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
    };

    const paymentColors: Record<string, string> = {
        unpaid: "bg-red-100 text-red-700",
        partial: "bg-yellow-100 text-yellow-700",
        paid: "bg-green-100 text-green-700",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
                <a href="/admin/pos/purchases/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} /> New Purchase
                </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Search purchases..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Purchase #</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Supplier</th>
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
                        ) : purchases.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">No purchases found</td></tr>
                        ) : purchases.map((p) => (
                            <tr key={p._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-blue-600">{p.purchaseNumber}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{p.supplierName || "Walk-in"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.total?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-green-600">{p.paidAmount?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-red-600">{p.dueAmount?.toFixed(2)}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${statusColors[p.status] || ""}`}>{p.status}</span></td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${paymentColors[p.paymentStatus] || ""}`}>{p.paymentStatus}</span></td>
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

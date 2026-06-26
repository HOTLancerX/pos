"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface InventoryItem {
    _id: string;
    productId: string;
    productName: string;
    type: string;
    quantity: number;
    referenceId: string;
    referenceType: string;
    note: string;
    createdBy: string;
    createdAt: string;
}

export default function InventoryList() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchInventory = () => {
        setLoading(true);
        fetch(`/api/pos/inventory?type=${typeFilter}&page=${page}&limit=20`)
            .then((r) => r.json())
            .then((d) => { setItems(d.items || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchInventory(); }, [typeFilter, page]);

    const typeColors: Record<string, string> = {
        in: "bg-green-100 text-green-700",
        out: "bg-red-100 text-red-700",
        adjustment: "bg-blue-100 text-blue-700",
        damage: "bg-orange-100 text-orange-700",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <div className="flex gap-2">
                    <a href="/admin/pos/inventory/stock-in" className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:shadow-md transition-all">
                        <Icon icon="solar:arrow-down-bold" width={16} /> Stock In
                    </a>
                    <a href="/admin/pos/inventory/stock-out" className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:shadow-md transition-all">
                        <Icon icon="solar:arrow-up-bold" width={16} /> Stock Out
                    </a>
                    <a href="/admin/pos/inventory/adjustment" className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:shadow-md transition-all">
                        <Icon icon="solar:settings-bold" width={16} /> Adjust
                    </a>
                    <a href="/admin/pos/inventory/damage" className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:shadow-md transition-all">
                        <Icon icon="solar:warning-bold" width={16} /> Damage
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">All Types</option>
                    <option value="in">Stock In</option>
                    <option value="out">Stock Out</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="damage">Damage</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Qty</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Reference</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Note</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No inventory records found</td></tr>
                        ) : items.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName || item.productId}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${typeColors[item.type] || "bg-gray-100 text-gray-700"}`}>{item.type}</span></td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{item.referenceType} #{item.referenceId?.slice(-6)}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{item.note}</td>
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

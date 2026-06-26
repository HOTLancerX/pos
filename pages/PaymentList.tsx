"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Payment {
    _id: string;
    paymentNumber: string;
    type: string;
    partyName: string;
    amount: number;
    method: string;
    referenceType: string;
    notes: string;
    createdAt: string;
}

export default function PaymentList() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPayments = () => {
        setLoading(true);
        fetch(`/api/pos/payments?type=${typeFilter}&page=${page}&limit=20`)
            .then((r) => r.json())
            .then((d) => { setPayments(d.payments || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPayments(); }, [typeFilter, page]);

    const methodIcons: Record<string, string> = {
        cash: "solar:money-bold",
        bank: "solar:bank-bold",
        mobile: "solar:smartphone-bold",
        card: "solar:credit-card-bold",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">All Types</option>
                    <option value="receivable">Receivable (Customer)</option>
                    <option value="payable">Payable (Supplier)</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment #</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Party</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Method</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : payments.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No payments found</td></tr>
                        ) : payments.map((p) => (
                            <tr key={p._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-emerald-600">{p.paymentNumber}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${p.type === "receivable" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{p.type}</span></td>
                                <td className="px-4 py-3 text-sm text-gray-900">{p.partyName || "Walk-in"}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.amount?.toFixed(2)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Icon icon={methodIcons[p.method] || "solar:money-bold"} width={16} className="text-gray-400" />
                                        <span className="text-sm text-gray-600 capitalize">{p.method}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
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

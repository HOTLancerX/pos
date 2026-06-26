"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Expense {
    _id: string;
    categoryName: string;
    amount: number;
    date: string;
    description: string;
    reference: string;
    createdBy: string;
    createdAt: string;
}

export default function ExpenseList() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ categoryName: "", amount: "", date: "", description: "", reference: "" });
    const [saving, setSaving] = useState(false);

    const fetchExpenses = () => {
        setLoading(true);
        fetch(`/api/pos/expenses?page=${page}&limit=20`)
            .then((r) => r.json())
            .then((d) => { setExpenses(d.expenses || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchExpenses(); }, [page]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/pos/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }) });
            if (res.ok) { setShowAdd(false); setForm({ categoryName: "", amount: "", date: "", description: "", reference: "" }); fetchExpenses(); }
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this expense?")) return;
        await fetch(`/api/pos/expenses/${id}`, { method: "DELETE" });
        fetchExpenses();
    };

    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-sm text-gray-500">Total: ৳{totalAmount.toFixed(2)}</p>
                </div>
                <button onClick={() => { setForm({ categoryName: "", amount: "", date: "", description: "", reference: "" }); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} /> Add Expense
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Description</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No expenses found</td></tr>
                        ) : expenses.map((e) => (
                            <tr key={e._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{e.categoryName || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{e.description}</td>
                                <td className="px-4 py-3 text-sm font-medium text-red-600">৳{e.amount?.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleDelete(e._id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Icon icon="solar:trash-bin-bold" width={16} /></button>
                                </td>
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

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Add Expense</h2>
                            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" width={20} /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input type="text" value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" rows={2} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reference</label><input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.amount} className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:shadow-md disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

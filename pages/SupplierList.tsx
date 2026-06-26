"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Supplier {
    _id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    city: string;
    status: string;
    dueAmount: number;
    createdAt: string;
}

export default function SupplierList() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showAdd, setShowAdd] = useState(false);
    const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "", city: "", state: "", zipCode: "", taxNumber: "", notes: "" });
    const [saving, setSaving] = useState(false);

    const fetchSuppliers = () => {
        setLoading(true);
        fetch(`/api/pos/suppliers?search=${search}&page=${page}&limit=20`)
            .then((r) => r.json())
            .then((d) => { setSuppliers(d.suppliers || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSuppliers(); }, [search, page]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editSupplier ? `/api/pos/suppliers/${editSupplier._id}` : "/api/pos/suppliers";
            const method = editSupplier ? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (res.ok) { setShowAdd(false); setEditSupplier(null); setForm({ name: "", email: "", phone: "", company: "", address: "", city: "", state: "", zipCode: "", taxNumber: "", notes: "" }); fetchSuppliers(); }
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this supplier?")) return;
        await fetch(`/api/pos/suppliers/${id}`, { method: "DELETE" });
        fetchSuppliers();
    };

    const openEdit = (s: Supplier) => {
        setEditSupplier(s);
        setForm({ name: s.name, email: s.email, phone: s.phone, company: s.company, address: s.address, city: s.city, state: "", zipCode: "", taxNumber: "", notes: "" });
        setShowAdd(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                <button onClick={() => { setEditSupplier(null); setForm({ name: "", email: "", phone: "", company: "", address: "", city: "", state: "", zipCode: "", taxNumber: "", notes: "" }); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} />
                    Add Supplier
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Company</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">City</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Due</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : suppliers.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-8 text-gray-500">No suppliers found</td></tr>
                        ) : suppliers.map((s) => (
                            <tr key={s._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{s.phone}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{s.company}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{s.city}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.status}</span></td>
                                <td className="px-4 py-3 text-sm text-red-600 font-medium">{s.dueAmount > 0 ? s.dueAmount.toFixed(2) : "-"}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Icon icon="solar:pen-bold" width={16} /></button>
                                        <button onClick={() => handleDelete(s._id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Icon icon="solar:trash-bin-bold" width={16} /></button>
                                    </div>
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
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">{editSupplier ? "Edit Supplier" : "Add Supplier"}</h2>
                            <button onClick={() => { setShowAdd(false); setEditSupplier(null); }} className="text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" width={20} /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label><input type="text" value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} /></div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={() => { setShowAdd(false); setEditSupplier(null); }} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.phone} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-md disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

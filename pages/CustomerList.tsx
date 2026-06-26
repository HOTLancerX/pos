"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";

const CustomerDetails = dynamic(() => import("./CustomerDetails"), { ssr: false });

interface Customer {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    status: string;
    dueAmount: number;
    walletBalance: number;
    createdAt: string;
}

function CustomerListView() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showAdd, setShowAdd] = useState(false);
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "", taxNumber: "", notes: "" });
    const [saving, setSaving] = useState(false);

    const fetchCustomers = () => {
        setLoading(true);
        fetch(`/api/pos/customers?search=${search}&page=${page}&limit=20`)
            .then((r) => r.json())
            .then((d) => { setCustomers(d.customers || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCustomers(); }, [search, page]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editCustomer ? `/api/pos/customers/${editCustomer._id}` : "/api/pos/customers";
            const method = editCustomer ? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (res.ok) { setShowAdd(false); setEditCustomer(null); setForm({ name: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "", taxNumber: "", notes: "" }); fetchCustomers(); }
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this customer?")) return;
        await fetch(`/api/pos/customers/${id}`, { method: "DELETE" });
        fetchCustomers();
    };

    const openEdit = (c: Customer) => {
        setEditCustomer(c);
        setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, city: c.city, state: "", zipCode: "", taxNumber: "", notes: "" });
        setShowAdd(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                <button onClick={() => { setEditCustomer(null); setForm({ name: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "", taxNumber: "", notes: "" }); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} />
                    Add Customer
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <input type="text" placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">City</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Wallet</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Due</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : customers.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">No customers found</td></tr>
                        ) : customers.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/admin/pos/customers/${c._id}`}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.city}</td>
                                <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{(c.walletBalance || 0) > 0 ? `৳${c.walletBalance.toFixed(2)}` : "-"}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{c.status}</span></td>
                                <td className="px-4 py-3 text-sm text-red-600 font-medium">{c.dueAmount > 0 ? c.dueAmount.toFixed(2) : "-"}</td>
                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => window.location.href = `/admin/pos/customers/${c._id}`} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="View Details"><Icon icon="solar:eye-bold" width={16} /></button>
                                        <button onClick={() => openEdit(c)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Icon icon="solar:pen-bold" width={16} /></button>
                                        <button onClick={() => handleDelete(c._id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Icon icon="solar:trash-bin-bold" width={16} /></button>
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
                            <h2 className="text-lg font-semibold">{editCustomer ? "Edit Customer" : "Add Customer"}</h2>
                            <button onClick={() => { setShowAdd(false); setEditCustomer(null); }} className="text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" width={20} /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label><input type="text" value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" rows={3} /></div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={() => { setShowAdd(false); setEditCustomer(null); }} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.phone} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CustomerList({ params }: { params?: { slug?: string[] } }) {
    const slug = params?.slug;
    if (slug && slug.length > 2) {
        return <CustomerDetails params={Promise.resolve({ slug })} />;
    }
    return <CustomerListView />;
}

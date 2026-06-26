"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Brand { _id: string; name: string; slug: string; description: string; logo: string; status: string; }

export default function BrandList() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [editBrand, setEditBrand] = useState<Brand | null>(null);
    const [form, setForm] = useState({ name: "", description: "", logo: "" });
    const [saving, setSaving] = useState(false);

    const fetchBrands = () => {
        setLoading(true);
        fetch(`/api/pos/brands?search=${search}`)
            .then((r) => r.json())
            .then((d) => setBrands(d.brands || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBrands(); }, [search]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editBrand ? `/api/pos/brands/${editBrand._id}` : "/api/pos/brands";
            const method = editBrand ? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (res.ok) { setShowAdd(false); setEditBrand(null); setForm({ name: "", description: "", logo: "" }); fetchBrands(); }
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this brand?")) return;
        await fetch(`/api/pos/brands/${id}`, { method: "DELETE" });
        fetchBrands();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
                <button onClick={() => { setEditBrand(null); setForm({ name: "", description: "", logo: "" }); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} /> Add Brand
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <input type="text" placeholder="Search brands..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></div>
                ) : brands.map((b) => (
                    <div key={b._id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">{b.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{b.description || "No description"}</p>
                                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${b.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.status}</span>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setEditBrand(b); setForm({ name: b.name, description: b.description, logo: b.logo }); setShowAdd(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Icon icon="solar:pen-bold" width={16} /></button>
                                <button onClick={() => handleDelete(b._id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Icon icon="solar:trash-bin-bold" width={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">{editBrand ? "Edit Brand" : "Add Brand"}</h2>
                            <button onClick={() => { setShowAdd(false); setEditBrand(null); }} className="text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" width={20} /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" rows={3} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label><input type="text" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" /></div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={() => { setShowAdd(false); setEditBrand(null); }} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-md disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

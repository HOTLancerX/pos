"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Unit { _id: string; name: string; shortName: string; baseUnit: string; conversionFactor: number; status: string; }

export default function UnitList() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [editUnit, setEditUnit] = useState<Unit | null>(null);
    const [form, setForm] = useState({ name: "", shortName: "", baseUnit: "", conversionFactor: "1" });
    const [saving, setSaving] = useState(false);

    const fetchUnits = () => {
        setLoading(true);
        fetch(`/api/pos/units?search=${search}`)
            .then((r) => r.json())
            .then((d) => setUnits(d.units || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUnits(); }, [search]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const body = { ...form, conversionFactor: parseFloat(form.conversionFactor) || 1 };
            const url = editUnit ? `/api/pos/units/${editUnit._id}` : "/api/pos/units";
            const method = editUnit ? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (res.ok) { setShowAdd(false); setEditUnit(null); setForm({ name: "", shortName: "", baseUnit: "", conversionFactor: "1" }); fetchUnits(); }
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this unit?")) return;
        await fetch(`/api/pos/units/${id}`, { method: "DELETE" });
        fetchUnits();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Units</h1>
                <button onClick={() => { setEditUnit(null); setForm({ name: "", shortName: "", baseUnit: "", conversionFactor: "1" }); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} /> Add Unit
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <input type="text" placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Short Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Base Unit</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Factor</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : units.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No units found</td></tr>
                        ) : units.map((u) => (
                            <tr key={u._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{u.shortName}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{u.baseUnit || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{u.conversionFactor}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.status}</span></td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => { setEditUnit(u); setForm({ name: u.name, shortName: u.shortName, baseUnit: u.baseUnit, conversionFactor: String(u.conversionFactor) }); setShowAdd(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Icon icon="solar:pen-bold" width={16} /></button>
                                        <button onClick={() => handleDelete(u._id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Icon icon="solar:trash-bin-bold" width={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">{editUnit ? "Edit Unit" : "Add Unit"}</h2>
                            <button onClick={() => { setShowAdd(false); setEditUnit(null); }} className="text-gray-400 hover:text-gray-600"><Icon icon="mdi:close" width={20} /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Short Name *</label><input type="text" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Base Unit</label><input type="text" value={form.baseUnit} onChange={(e) => setForm({ ...form, baseUnit: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Conversion Factor</label><input type="number" value={form.conversionFactor} onChange={(e) => setForm({ ...form, conversionFactor: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none" /></div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={() => { setShowAdd(false); setEditUnit(null); }} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.name || !form.shortName} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-600 text-white rounded-lg hover:shadow-md disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

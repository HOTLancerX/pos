"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Settings {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    companyLogo: string;
    currency: string;
    currencySymbol: string;
    taxRate: number;
    taxType: string;
    invoicePrefix: string;
    invoiceFooter: string;
    receiptWidth: string;
    lowStockThreshold: number;
    dateFormat: string;
    timezone: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        companyName: "", companyEmail: "", companyPhone: "", companyAddress: "", companyLogo: "",
        currency: "BDT", currencySymbol: "৳", taxRate: 0, taxType: "exclusive",
        invoicePrefix: "INV", invoiceFooter: "Thank you for your purchase!", receiptWidth: "80mm",
        lowStockThreshold: 10, dateFormat: "YYYY-MM-DD", timezone: "Asia/Dhaka",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("/api/pos/settings")
            .then((r) => r.json())
            .then((d) => { if (d._id) setSettings(d); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch("/api/pos/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">POS Settings</h1>
                {saved && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Saved!</span>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label><input type="text" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={settings.companyEmail} onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={settings.companyPhone} onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={settings.companyAddress} onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label><input type="text" value={settings.companyLogo} onChange={(e) => setSettings({ ...settings, companyLogo: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice & Currency</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><input type="text" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label><input type="text" value={settings.currencySymbol} onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label><input type="number" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label><select value={settings.taxType} onChange={(e) => setSettings({ ...settings, taxType: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"><option value="inclusive">Inclusive</option><option value="exclusive">Exclusive</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label><input type="text" value={settings.invoicePrefix} onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Invoice Footer</label><input type="text" value={settings.invoiceFooter} onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Printer & Stock</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Receipt Width</label><select value={settings.receiptWidth} onChange={(e) => setSettings({ ...settings, receiptWidth: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"><option value="58mm">58mm</option><option value="80mm">80mm</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label><input type="number" value={settings.lowStockThreshold} onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 10 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" /></div>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 transition-all">
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
}

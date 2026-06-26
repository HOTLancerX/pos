"use client";

import { useState, useEffect, use } from "react";
import { Icon } from "@iconify/react";

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
    totalPurchases: number;
    totalPaid: number;
    createdAt: string;
}

interface Sale {
    _id: string;
    saleNumber: string;
    customerName: string;
    items: any[];
    subtotal: number;
    discount: number;
    total: number;
    paidAmount: number;
    walletUsed: number;
    dueAmount: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
}

export default function CustomerDetails({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = use(params);
    const customerId = slug[2];

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
    const [walletAdjustment, setWalletAdjustment] = useState("");
    const [adjustmentType, setAdjustmentType] = useState<"add" | "deduct">("add");
    const [adjusting, setAdjusting] = useState(false);

    useEffect(() => {
        if (customerId) fetchCustomerData();
    }, [customerId]);

    const fetchCustomerData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pos/customers/${customerId}?view=history`);
            const data = await res.json();
            setCustomer(data.customer);
            setSales(data.sales || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleWalletAdjustment = async () => {
        const amount = parseFloat(walletAdjustment);
        if (!amount || amount <= 0) return;
        setAdjusting(true);
        try {
            const adjustment = adjustmentType === "add" ? amount : -amount;
            await fetch(`/api/pos/customers/${customerId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAdjustment: adjustment }),
            });
            setWalletAdjustment("");
            fetchCustomerData();
        } catch (e) { console.error(e); }
        setAdjusting(false);
    };

    const totalSpent = sales.filter(s => s.status !== "cancelled").reduce((sum, s) => sum + s.total, 0);
    const totalPaid = sales.filter(s => s.status !== "cancelled").reduce((sum, s) => sum + s.paidAmount + (s.walletUsed || 0), 0);
    const totalDue = sales.filter(s => s.status !== "cancelled").reduce((sum, s) => sum + s.dueAmount, 0);
    const walletUsed = sales.filter(s => s.status !== "cancelled").reduce((sum, s) => sum + (s.walletUsed || 0), 0);
    const cancelledCount = sales.filter(s => s.status === "cancelled").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-24 text-gray-500">
                <Icon icon="solar:user-cross-bold" width={48} className="text-gray-300 mx-auto mb-2" />
                <p>Customer not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <a href="/admin/pos/customers" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-1">
                        <Icon icon="solar:arrow-left-bold" width={14} /> Back to Customers
                    </a>
                    <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                    <p className="text-sm text-gray-500">{customer.phone} {customer.email ? `• ${customer.email}` : ""}</p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${customer.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {customer.status}
                </span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
                    <p className="text-xl font-bold text-emerald-600">৳{(customer.walletBalance || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Purchases</p>
                    <p className="text-xl font-bold text-gray-900">৳{totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                    <p className="text-xl font-bold text-blue-600">৳{totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Wallet Used</p>
                    <p className="text-xl font-bold text-purple-600">৳{walletUsed.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Due Amount</p>
                    <p className={`text-xl font-bold ${totalDue > 0 ? "text-red-600" : "text-gray-900"}`}>৳{totalDue.toFixed(2)}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === "overview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    Purchase History ({sales.length})
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Wallet Management */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Wallet Management</h3>
                        <div className="bg-emerald-50 rounded-lg p-3 mb-3">
                            <p className="text-xs text-emerald-600 mb-1">Current Balance</p>
                            <p className="text-2xl font-bold text-emerald-700">৳{(customer.walletBalance || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={adjustmentType}
                                onChange={(e) => setAdjustmentType(e.target.value as "add" | "deduct")}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="add">Add Balance</option>
                                <option value="deduct">Deduct Balance</option>
                            </select>
                            <input
                                type="number"
                                value={walletAdjustment}
                                onChange={(e) => setWalletAdjustment(e.target.value)}
                                placeholder="Amount"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                                onClick={handleWalletAdjustment}
                                disabled={adjusting || !walletAdjustment}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {adjusting ? "..." : "Apply"}
                            </button>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Phone</span>
                                <span className="text-gray-900">{customer.phone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Email</span>
                                <span className="text-gray-900">{customer.email || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Address</span>
                                <span className="text-gray-900">{customer.address || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">City</span>
                                <span className="text-gray-900">{customer.city || "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Orders</span>
                                <span className="text-gray-900">{sales.length} ({cancelledCount} cancelled)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Member Since</span>
                                <span className="text-gray-900">{new Date(customer.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Invoice #</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Items</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Paid</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Wallet</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Due</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sales.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No purchase history</td></tr>
                            ) : sales.map(sale => (
                                <tr key={sale._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.open(`/admin/pos/sales/${sale._id}`, "_blank")}>
                                    <td className="px-4 py-3 text-sm font-medium text-emerald-600">{sale.saleNumber}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(sale.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{sale.items.length}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">৳{sale.total.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-green-600">৳{sale.paidAmount.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-purple-600">{sale.walletUsed ? `৳${sale.walletUsed.toFixed(2)}` : "-"}</td>
                                    <td className="px-4 py-3 text-sm text-red-600">{sale.dueAmount > 0 ? `৳${sale.dueAmount.toFixed(2)}` : "-"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            sale.status === "completed" ? "bg-green-100 text-green-700"
                                            : sale.status === "cancelled" ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

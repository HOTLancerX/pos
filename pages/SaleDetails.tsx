"use client";

import { useState, useEffect, useRef, use } from "react";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/Toast";

interface SaleItem {
    productId: string;
    variantId: string;
    variantLabel: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    subtotal: number;
}

interface Sale {
    _id: string;
    saleNumber: string;
    customerId: string;
    customerName: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    paidAmount: number;
    walletUsed: number;
    dueAmount: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    notes: string;
    createdBy: string;
    createdAt: string;
    cancelledAt?: string;
    cancelReason?: string;
}

export default function SaleDetails({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = use(params);
    const saleId = slug[2];
    const toast = useToast();

    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (saleId) fetchSale();
    }, [saleId]);

    const fetchSale = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pos/sales/${saleId}`);
            const data = await res.json();
            setSale(data.sale);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCancelSale = async () => {
        setCancelling(true);
        try {
            const res = await fetch(`/api/pos/sales/${saleId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cancel: true, cancelReason }),
            });
            if (res.ok) {
                setShowCancelModal(false);
                fetchSale();
                toast.success("Sale cancelled successfully. Stock and wallet have been adjusted.");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to cancel sale");
            }
        } catch {
            toast.error("Network error. Please try again.");
        }
        setCancelling(false);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
            <head>
                <title>Invoice ${sale?.saleNumber}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
                    .header h1 { color: #10b981; margin: 0; font-size: 24px; }
                    .header p { color: #666; margin: 5px 0 0; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                    .info-label { color: #666; }
                    .info-value { font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f3f4f6; padding: 10px; text-align: left; font-size: 13px; border-bottom: 2px solid #e5e7eb; }
                    td { padding: 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
                    .total-row { font-weight: bold; background: #f9fafb; }
                    .summary { margin-top: 20px; }
                    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
                    .summary-row.total { font-size: 18px; font-weight: bold; color: #10b981; border-top: 2px solid #e5e7eb; padding-top: 10px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const statusColors: Record<string, string> = {
        completed: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        cancelled: "bg-red-100 text-red-700",
        held: "bg-blue-100 text-blue-700",
        draft: "bg-gray-100 text-gray-700",
    };

    const paymentColors: Record<string, string> = {
        unpaid: "bg-red-100 text-red-700",
        partial: "bg-yellow-100 text-yellow-700",
        paid: "bg-green-100 text-green-700",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" />
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="text-center py-24 text-gray-500">
                <Icon icon="solar:bill-cross-bold" width={48} className="text-gray-300 mx-auto mb-2" />
                <p>Sale not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <a href="/admin/pos/sales" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-1">
                        <Icon icon="solar:arrow-left-bold" width={14} /> Back to Sales
                    </a>
                    <h1 className="text-2xl font-bold text-gray-900">Invoice {sale.saleNumber}</h1>
                    <p className="text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleString()}
                        {sale.customerName && ` • ${sale.customerName}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                    >
                        <Icon icon="solar:printer-bold" width={16} /> Print
                    </button>
                    {sale.status !== "cancelled" && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                        >
                            <Icon icon="solar:close-circle-bold" width={16} /> Cancel Sale
                        </button>
                    )}
                </div>
            </div>

            {/* Status Badges */}
            <div className="flex gap-2">
                <span className={`px-3 py-1 text-sm rounded-full ${statusColors[sale.status] || ""}`}>{sale.status}</span>
                <span className={`px-3 py-1 text-sm rounded-full ${paymentColors[sale.paymentStatus] || ""}`}>{sale.paymentStatus}</span>
                {sale.cancelledAt && (
                    <span className="text-sm text-red-500">
                        Cancelled on {new Date(sale.cancelledAt).toLocaleString()}
                        {sale.cancelReason && ` — ${sale.cancelReason}`}
                    </span>
                )}
            </div>

            {/* Invoice Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Items Table */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden" ref={printRef}>
                    {/* Printable Content */}
                    <div className="p-6">
                        <div className="header">
                            <h1>INVOICE</h1>
                            <p>{sale.saleNumber} • {new Date(sale.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bill To</p>
                                <p className="font-semibold">{sale.customerName || "Walk-in Customer"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
                                <p className="font-semibold capitalize">{sale.paymentMethod}</p>
                            </div>
                        </div>

                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-2 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                                    <th className="py-2 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                                    <th className="py-2 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                                    <th className="py-2 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-50">
                                        <td className="py-3">
                                            <p className="font-medium text-sm">{item.productName}</p>
                                            {item.variantLabel && <p className="text-xs text-blue-600">{item.variantLabel}</p>}
                                            {item.productSku && <p className="text-xs text-gray-400">SKU: {item.productSku}</p>}
                                        </td>
                                        <td className="py-3 text-right text-sm">{item.quantity}</td>
                                        <td className="py-3 text-right text-sm">৳{item.unitPrice.toFixed(2)}</td>
                                        <td className="py-3 text-right text-sm font-medium">৳{item.subtotal.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="summary mt-6 border-t border-gray-200 pt-4">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>৳{sale.subtotal.toFixed(2)}</span>
                            </div>
                            {sale.discount > 0 && (
                                <div className="summary-row">
                                    <span>Discount</span>
                                    <span className="text-red-600">-৳{sale.discount.toFixed(2)}</span>
                                </div>
                            )}
                            {sale.walletUsed > 0 && (
                                <div className="summary-row">
                                    <span>Paid from Wallet</span>
                                    <span className="text-purple-600">-৳{sale.walletUsed.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>৳{sale.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Amount</span>
                                <span className="font-medium">৳{sale.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Cash/Card/Mobile Paid</span>
                                <span className="font-medium text-green-600">৳{sale.paidAmount.toFixed(2)}</span>
                            </div>
                            {sale.walletUsed > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Wallet Used</span>
                                    <span className="font-medium text-purple-600">৳{sale.walletUsed.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                                <span className="text-gray-600">Due Amount</span>
                                <span className={`font-medium ${sale.dueAmount > 0 ? "text-red-600" : "text-gray-900"}`}>৳{sale.dueAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {sale.notes && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                            <p className="text-sm text-gray-600">{sale.notes}</p>
                        </div>
                    )}

                    {sale.customerName && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
                            <p className="text-sm text-gray-900">{sale.customerName}</p>
                            {sale.customerId && (
                                <a
                                    href={`/admin/pos/customers/${sale.customerId}`}
                                    target="_blank"
                                    className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block"
                                >
                                    View Customer Details →
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-red-600">Cancel Sale</h2>
                            <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="mdi:close" width={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-700">
                                    <strong>Warning:</strong> This will cancel the sale and:
                                </p>
                                <ul className="text-sm text-red-600 mt-2 space-y-1 list-disc list-inside">
                                    <li>Restore all product stock</li>
                                    {sale.walletUsed > 0 && <li>Refund ৳{sale.walletUsed.toFixed(2)} to customer wallet</li>}
                                    <li>Adjust customer purchase and payment totals</li>
                                </ul>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter reason..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Keep Sale
                                </button>
                                <button
                                    onClick={handleCancelSale}
                                    disabled={cancelling}
                                    className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
                                >
                                    {cancelling ? "Cancelling..." : "Cancel Sale"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface LogEntry {
    _id: string;
    action: string;
    type: string;
    referenceId: string;
    description: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
}

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = () => {
        setLoading(true);
        fetch(`/api/pos/activity?type=${typeFilter}&page=${page}&limit=50`)
            .then((r) => r.json())
            .then((d) => { setLogs(d.logs || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchLogs(); }, [typeFilter, page]);

    const actionIcons: Record<string, string> = {
        create: "solar:add-circle-bold",
        update: "solar:pen-bold",
        delete: "solar:trash-bin-bold",
    };

    const actionColors: Record<string, string> = {
        create: "text-green-600 bg-green-50",
        update: "text-blue-600 bg-blue-50",
        delete: "text-red-600 bg-red-50",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">All Types</option>
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                    <option value="product">Product</option>
                    <option value="sale">Sale</option>
                    <option value="purchase">Purchase</option>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="payment">Payment</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No activity logs found</div>
                    ) : logs.map((log) => (
                        <div key={log._id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${actionColors[log.action] || "bg-gray-100 text-gray-600"}`}>
                                <Icon icon={actionIcons[log.action] || "solar:info-circle-bold"} width={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{log.description}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500">{log.type}</span>
                                    <span className="text-xs text-gray-500">by {log.createdByName || log.createdBy}</span>
                                    <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
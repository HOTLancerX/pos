"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Product {
    _id: string;
    title: string;
    slug: string;
    type: string;
    category: string;
    status: string;
    createdAt: string;
    info: Record<string, string>;
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        setLoading(true);
        fetch(`/api/post?type=product&search=${search}&limit=100`)
            .then((r) => r.json())
            .then((d) => setProducts(d.posts || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [search]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Products (POS)</h1>
                <a href="/admin/posts/product/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} /> Add Product
                </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">SKU</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Price</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Stock</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No products found</td></tr>
                        ) : products.map((p) => (
                            <tr key={p._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.title}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{p.info?.sku || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{p.info?.price || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{p.info?.stock || "-"}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{p.status}</span></td>
                                <td className="px-4 py-3 text-right">
                                    <a href={`/admin/posts/product/${p._id}`} className="p-1 text-blue-600 hover:bg-blue-50 rounded inline-flex"><Icon icon="solar:pen-bold" width={16} /></a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

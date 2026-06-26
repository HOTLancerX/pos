"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Product {
    _id: string;
    title: string;
    barcode: string;
    sku: string;
    categoryName: string;
    regularprice: number;
    sellingprice: number;
    stock: number;
    status: string;
    createdAt: string;
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = () => {
        setLoading(true);
        fetch(`/api/pos/products?search=${search}&page=${page}&limit=20`)
            .then((r) => r.json())
            .then((d) => { setProducts(d.products || []); setTotalPages(d.pages || 1); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProducts(); }, [search, page]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Products (POS View)</h1>
                <div className="flex gap-2">
                    <a href="/admin/pos/terminal" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition-all text-sm">
                        <Icon icon="solar:shop-bold" width={18} /> Open POS Terminal
                    </a>
                    <a href="/admin/posts/product/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all text-sm">
                        <Icon icon="solar:add-circle-bold" width={18} /> Add Product
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <input type="text" placeholder="Search products by name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Barcode / SKU</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Regular Price</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Selling Price</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Stock</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">No products found. Create products in the Product section.</td></tr>
                        ) : products.map((p) => (
                            <tr key={p._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.title}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 font-mono">{p.barcode || p.sku || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{p.categoryName || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">৳{p.regularprice}</td>
                                <td className="px-4 py-3 text-sm font-medium text-emerald-600">৳{p.sellingprice}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-sm font-medium ${p.stock <= 0 ? "text-red-600" : "text-gray-900"}`}>{p.stock}</span>
                                    {p.stock <= 0 && <span className="ml-1 text-xs text-red-500">Out</span>}
                                </td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{p.status}</span></td>
                                <td className="px-4 py-3 text-right">
                                    <a href={`/admin/posts/product/${p._id}`} className="p-1 text-blue-600 hover:bg-blue-50 rounded inline-flex"><Icon icon="solar:pen-bold" width={16} /></a>
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
        </div>
    );
}

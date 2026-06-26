"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Category {
    _id: string;
    title: string;
    slug: string;
    type: string;
    status: string;
    parentId: string | null;
}

export default function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch("/api/cat?type=product-category")
            .then((r) => r.json())
            .then((d) => setCategories(d.cats || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
                <a href="/admin/category/product-category/new" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} /> Add Category
                </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Slug</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Parent</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No categories found</td></tr>
                        ) : categories.map((c) => (
                            <tr key={c._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.title}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.slug}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.parentId || "—"}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${c.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{c.status}</span></td>
                                <td className="px-4 py-3 text-right">
                                    <a href={`/admin/category/product-category/${c._id}`} className="p-1 text-blue-600 hover:bg-blue-50 rounded inline-flex"><Icon icon="solar:pen-bold" width={16} /></a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

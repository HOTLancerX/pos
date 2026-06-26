"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface Category {
    _id: string;
    title: string;
    slug: string;
    image: string;
    icon: string;
    featured: boolean;
    parentId: string | null;
    status: string;
}

export default function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchCategories = () => {
        setLoading(true);
        fetch(`/api/pos/categories?search=${search}`)
            .then((r) => r.json())
            .then((d) => setCategories(d.categories || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCategories(); }, [search]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Product Categories (POS View)</h1>
                <a href="/admin/category/product-category" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-md transition-all">
                    <Icon icon="solar:add-circle-bold" width={18} /> Manage Categories
                </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <input type="text" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-8"><Icon icon="svg-spinners:ring-resize" width={24} className="text-gray-400" /></div>
                ) : categories.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">No categories found.</div>
                ) : categories.map((c) => (
                    <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                                {c.image ? (
                                    <img src={c.image} alt={c.title} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <Icon icon={c.icon || "solar:folder-with-files-bold"} width={24} className="text-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900">{c.title}</h3>
                                <p className="text-xs text-gray-500">{c.slug}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${c.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{c.status}</span>
                                    {c.featured && <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Featured</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

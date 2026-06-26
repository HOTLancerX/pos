"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/ui/Toast";

interface Product {
    _id: string;
    title: string;
    barcode: string;
    sku: string;
    sellingprice: number;
    regularprice: number;
    stock: number;
    categoryId: string;
    categoryName: string;
    priceType: string;
    variants: Variant[];
    images: string[];
    image: string;
}

interface Variant {
    id: string;
    handle: string;
    title: string;
    options: Record<string, string>;
    sku: string;
    price: string;
    quantity: string;
    image: string;
    gallery: string[];
}

interface CartItem {
    productId: string;
    variantId?: string;
    title: string;
    variantLabel?: string;
    barcode: string;
    price: number;
    quantity: number;
    subtotal: number;
    image: string;
}

interface Category {
    _id: string;
    title: string;
    image: string;
    parentId: string | null;
}

interface CategoryNode extends Category {
    children: CategoryNode[];
    count: number;
}

interface Customer {
    _id: string;
    name: string;
    phone: string;
    walletBalance: number;
    dueAmount: number;
}

export default function PosTerminal() {
    const toast = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [barcodeInput, setBarcodeInput] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paidAmount, setPaidAmount] = useState("");
    const [discount, setDiscount] = useState(0);
    const [useWallet, setUseWallet] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVariantModal, setShowVariantModal] = useState<Product | null>(null);
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
    const barcodeRef = useRef<HTMLInputElement>(null);
    const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        Promise.all([fetchProducts(), fetchCategories()]).then(() => setLoading(false));
        barcodeRef.current?.focus();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/pos/products?status=published&limit=500");
            const data = await res.json();
            setProducts(data.products || []);
        } catch (e) { console.error(e); }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/pos/categories?status=active");
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (e) { console.error(e); }
    };

    const lookupCustomer = async (phone: string) => {
        if (!phone || phone.length < 3) {
            setSelectedCustomer(null);
            return;
        }
        setCustomerLookupLoading(true);
        try {
            const res = await fetch(`/api/pos/customers?phone=${encodeURIComponent(phone)}`);
            const data = await res.json();
            if (data.customer) {
                setSelectedCustomer(data.customer);
            } else {
                setSelectedCustomer(null);
            }
        } catch { setSelectedCustomer(null); }
        setCustomerLookupLoading(false);
    };

    const handlePhoneChange = (value: string) => {
        setCustomerPhone(value);
        if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
        phoneDebounceRef.current = setTimeout(() => lookupCustomer(value), 400);
    };

    const handleQuickCreateCustomer = async () => {
        if (!customerPhone || customerPhone.length < 3) return;
        setCustomerLookupLoading(true);
        try {
            const res = await fetch("/api/pos/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: customerPhone, quickCreate: true }),
            });
            const data = await res.json();
            if (data.customer) {
                setSelectedCustomer(data.customer);
            }
        } catch (e) { console.error(e); }
        setCustomerLookupLoading(false);
    };

    const addToCartByBarcode = (barcode: string) => {
        const product = products.find(p => p.barcode === barcode || p.sku === barcode);
        if (product) {
            handleProductClick(product);
            setBarcodeInput("");
            return;
        }
        const variantProduct = products.find(p =>
            p.variants.some(v => v.handle === barcode || v.sku === barcode)
        );
        if (variantProduct) {
            const variant = variantProduct.variants.find(v => v.handle === barcode || v.sku === barcode);
            if (variant) {
                addVariantToCart(variantProduct, variant);
                setBarcodeInput("");
                return;
            }
        }
        toast.error("Product not found: " + barcode);
    };

    const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && barcodeInput.trim()) {
            addToCartByBarcode(barcodeInput.trim());
        }
    };

    const getAvailableStock = (productId: string, variantId?: string): number => {
        const product = products.find(p => p._id === productId);
        if (!product) return 0;
        if (variantId) {
            const variant = product.variants.find(v => v.id === variantId);
            const variantStock = parseInt(variant?.quantity || "0") || 0;
            const inCart = cart.filter(item => item.productId === productId && item.variantId === variantId).reduce((sum, item) => sum + item.quantity, 0);
            return Math.max(0, variantStock - inCart);
        }
        const stock = product.stock || 0;
        const inCart = cart.filter(item => item.productId === productId && !item.variantId).reduce((sum, item) => sum + item.quantity, 0);
        return Math.max(0, stock - inCart);
    };

    const handleProductClick = (product: Product) => {
        const available = getAvailableStock(product._id);
        if (available <= 0 && product.priceType === "single") {
            toast.warning("Out of stock!");
            return;
        }
        if (product.priceType === "variant" && product.variants.length > 0) {
            setShowVariantModal(product);
            return;
        }
        addSingleToCart(product);
    };

    const addSingleToCart = (product: Product) => {
        const available = getAvailableStock(product._id);
        if (available <= 0) {
            toast.warning("Out of stock!");
            return;
        }
        setCart(prev => {
            const existing = prev.find(item => item.productId === product._id && !item.variantId);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.warning("Insufficient stock!");
                    return prev;
                }
                return prev.map(item =>
                    item.productId === product._id && !item.variantId
                        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                        : item
                );
            }
            return [...prev, {
                productId: product._id,
                title: product.title,
                barcode: product.barcode || product.sku,
                price: product.sellingprice,
                quantity: 1,
                subtotal: product.sellingprice,
                image: product.image || "",
            }];
        });
    };

    const addVariantToCart = (product: Product, variant: Variant) => {
        const variantStock = parseInt(variant.quantity) || 0;
        if (variantStock <= 0) {
            toast.warning("This variant is out of stock!");
            return;
        }
        setCart(prev => {
            const existing = prev.find(item => item.productId === product._id && item.variantId === variant.id);
            if (existing) {
                if (existing.quantity >= variantStock) {
                    toast.warning("Insufficient stock for this variant!");
                    return prev;
                }
                return prev.map(item =>
                    item.productId === product._id && item.variantId === variant.id
                        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                        : item
                );
            }
            const variantLabel = Object.entries(variant.options).map(([, v]) => v).join(" / ");
            const variantPrice = parseFloat(variant.price) || product.sellingprice;
            return [...prev, {
                productId: product._id,
                variantId: variant.id,
                title: product.title,
                variantLabel,
                barcode: variant.handle || variant.sku || "",
                price: variantPrice,
                quantity: 1,
                subtotal: variantPrice,
                image: variant.image || product.image || "",
            }];
        });
        setShowVariantModal(null);
    };

    const updateQuantity = (index: number, qty: number) => {
        if (qty < 1) {
            setCart(prev => prev.filter((_, i) => i !== index));
            return;
        }
        setCart(prev => {
            const item = prev[index];
            if (!item) return prev;
            const maxStock = item.variantId
                ? (products.find(p => p._id === item.productId)?.variants.find(v => v.id === item.variantId))
                    ? parseInt(products.find(p => p._id === item.productId)?.variants.find(v => v.id === item.variantId)?.quantity || "0") || 0
                    : 0
                : products.find(p => p._id === item.productId)?.stock || 0;
            const clampedQty = Math.min(qty, maxStock);
            if (clampedQty < qty) {
                toast.warning(`Only ${maxStock} in stock`);
            }
            return prev.map((it, i) =>
                i === index
                    ? { ...it, quantity: clampedQty, subtotal: clampedQty * it.price }
                    : it
            );
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const total = Math.max(0, subtotal - discount);
    const walletBalance = selectedCustomer?.walletBalance || 0;
    const effectiveWalletUse = useWallet && walletBalance > 0;
    const walletUsedAmount = effectiveWalletUse ? Math.min(walletBalance, total) : 0;
    const remainingAfterWallet = Math.max(0, total - walletUsedAmount);
    const finalPaidAmount = parseFloat(paidAmount) || 0;
    const overpayAmount = finalPaidAmount > remainingAfterWallet ? finalPaidAmount - remainingAfterWallet : 0;
    const walletCoversAll = effectiveWalletUse && walletUsedAmount >= total;

    const submitSale = async (paid: number, method: string, wallet: number) => {
        if (cart.length === 0) return;
        setSaving(true);
        try {
            const saleData = {
                customerId: selectedCustomer?._id || null,
                customerName: selectedCustomer?.name || "",
                items: cart.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId || null,
                    productName: item.title,
                    variantLabel: item.variantLabel || "",
                    productSku: item.barcode,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    discount: 0,
                    tax: 0,
                    subtotal: item.subtotal,
                })),
                subtotal,
                discount,
                tax: 0,
                shipping: 0,
                total,
                paidAmount: paid,
                walletUsed: wallet,
                dueAmount: Math.max(0, total - wallet - paid),
                paymentMethod: method,
                notes: "",
            };

            const res = await fetch("/api/pos/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(saleData),
            });

            if (res.ok) {
                const result = await res.json();
                let message = `Sale completed! Invoice: ${result.saleNumber}`;
                if (wallet > 0) message += `\n৳${wallet.toFixed(2)} deducted from wallet.`;
                if (overpayAmount > 0 && paid > 0) message += `\n৳${overpayAmount.toFixed(2)} added to customer wallet.`;
                toast.success(message);
                setCart([]);
                setSelectedCustomer(null);
                setCustomerPhone("");
                setPaidAmount("");
                setDiscount(0);
                setUseWallet(false);
                setShowPayment(false);
                fetchProducts();
                if (selectedCustomer) lookupCustomer(selectedCustomer.phone);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create sale");
            }
        } catch {
            toast.error("Network error. Please try again.");
        }
        setSaving(false);
    };

    const handlePayNow = () => {
        if (cart.length === 0) return;
        if (walletCoversAll) {
            submitSale(0, "wallet", walletUsedAmount);
        } else if (remainingAfterWallet <= 0) {
            submitSale(0, "wallet", walletUsedAmount);
        } else {
            setPaidAmount("");
            setShowPayment(true);
        }
    };

    const handleCheckout = async () => {
        const paid = parseFloat(paidAmount) || remainingAfterWallet;
        await submitSale(paid, paymentMethod, walletUsedAmount);
    };

    const filteredProducts = useMemo(() => {
        if (!selectedCategoryId) {
            return products.filter(p => {
                return !searchQuery ||
                    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.barcode.includes(searchQuery) ||
                    p.sku.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }
        const catIds = getDescendantCategoryIds(selectedCategoryId);
        return products.filter(p => {
            const matchCat = catIds.has(p.categoryId);
            const matchSearch = !searchQuery ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.barcode.includes(searchQuery) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, searchQuery, selectedCategoryId, categories]);

    const categoryTree = useMemo<CategoryNode[]>(() => {
        const catMap = new Map<string, CategoryNode>();
        for (const cat of categories) {
            catMap.set(cat._id, { ...cat, children: [], count: 0 });
        }
        const roots: CategoryNode[] = [];
        for (const cat of categories) {
            const node = catMap.get(cat._id)!;
            if (cat.parentId && catMap.has(cat.parentId)) {
                catMap.get(cat.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        }
        for (const p of products) {
            if (!p.categoryId) continue;
            let current = catMap.get(p.categoryId);
            while (current) {
                current.count++;
                if (current.parentId && catMap.has(current.parentId)) {
                    current = catMap.get(current.parentId)!;
                } else {
                    break;
                }
            }
        }
        return roots;
    }, [categories, products]);

    function getDescendantCategoryIds(catId: string): Set<string> {
        const ids = new Set<string>([catId]);
        const stack = [catId];
        while (stack.length) {
            const current = stack.pop()!;
            for (const cat of categories) {
                if (cat.parentId === current) {
                    ids.add(cat._id);
                    stack.push(cat._id);
                }
            }
        }
        return ids;
    }

    const toggleExpand = (catId: string) => {
        setExpandedCats(prev => {
            const next = new Set(prev);
            if (next.has(catId)) next.delete(catId);
            else next.add(catId);
            return next;
        });
    };

    const renderCategoryNode = (node: CategoryNode, depth: number = 0) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedCats.has(node._id);
        const isSelected = selectedCategoryId === node._id;

        return (
            <div key={node._id}>
                <button
                    onClick={() => {
                        if (hasChildren) toggleExpand(node._id);
                        setSelectedCategoryId(isSelected ? "" : node._id);
                    }}
                    className={`w-full text-left text-sm transition-colors flex items-center border-b border-gray-50 ${
                        isSelected
                            ? "bg-emerald-50 text-emerald-700 border-l-2 border-l-emerald-500"
                            : "text-gray-600 hover:bg-gray-50"
                    }`}
                    style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}
                >
                    {hasChildren ? (
                        <Icon
                            icon={isExpanded ? "solar:arrow-down-linear" : "solar:arrow-right-linear"}
                            width={14}
                            className="shrink-0 mr-1 text-gray-400"
                        />
                    ) : (
                        <span className="w-[14px] shrink-0 mr-1" />
                    )}
                    <span className="truncate flex-1">{node.title}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-1">{node.count}</span>
                </button>
                {hasChildren && isExpanded && (
                    <div>
                        {node.children.map(child => renderCategoryNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-3">
            {/* Left: Category Sidebar + Products */}
            <div className="flex-1 flex min-h-0 gap-3">
                {/* Category Sidebar */}
                <div className="hidden lg:flex flex-col w-56 bg-white rounded-xl border border-gray-200 overflow-hidden shrink-0">
                    <button
                        onClick={() => setSelectedCategoryId("")}
                        className={`px-3 py-2.5 text-left text-sm font-medium border-b border-gray-100 transition-colors ${
                            !selectedCategoryId
                                ? "bg-emerald-50 text-emerald-700 border-l-2 border-l-emerald-500"
                                : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        All Products
                        <span className="float-right text-xs text-gray-400">{products.length}</span>
                    </button>
                    <div className="flex-1 overflow-y-auto">
                        {categoryTree.map(node => renderCategoryNode(node, 0))}
                    </div>
                </div>

                {/* Products Panel */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Search + Mobile Category Filter */}
                    <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <Icon icon="solar:barcode-bold" width={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    ref={barcodeRef}
                                    type="text"
                                    placeholder="Scan barcode or type to search..."
                                    value={barcodeInput}
                                    onChange={(e) => { setBarcodeInput(e.target.value); setSearchQuery(e.target.value); }}
                                    onKeyDown={handleBarcodeKeyDown}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    autoFocus
                                />
                            </div>
                            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg shrink-0">
                                {cart.length} items
                            </div>
                        </div>

                        {/* Mobile Category Chips */}
                        <div className="flex lg:hidden gap-2 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
                            <button
                                onClick={() => setSelectedCategoryId("")}
                                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    !selectedCategoryId
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                All
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat._id}
                                    onClick={() => setSelectedCategoryId(selectedCategoryId === cat._id ? "" : cat._id)}
                                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        selectedCategoryId === cat._id
                                            ? "bg-emerald-500 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {cat.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-3">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Icon icon="svg-spinners:ring-resize" width={32} className="text-gray-400" />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <Icon icon="solar:box-bold" width={48} className="text-gray-300 mb-2" />
                                <p>No products found</p>
                                <p className="text-xs text-gray-400 mt-1">Add products via Product menu first</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {filteredProducts.map(product => (
                                    <button
                                        key={product._id}
                                        onClick={() => handleProductClick(product)}
                                        disabled={product.stock <= 0 && product.priceType === "single"}
                                        className="text-left rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                                    >
                                        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {product.image ? (
                                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Icon icon="solar:box-bold" width={32} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs font-medium text-gray-900 truncate">{product.title}</p>
                                            {product.priceType === "variant" && product.variants.length > 0 ? (
                                                <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                                                    From ৳{Math.min(...product.variants.map(v => parseFloat(v.price) || 0).filter(p => p > 0)).toFixed(2) || "0.00"}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-emerald-600 font-semibold mt-0.5">৳{product.sellingprice}</p>
                                            )}
                                            {product.priceType === "variant" ? (
                                                <p className="text-[10px] text-blue-500 mt-0.5">{product.variants.length} variants</p>
                                            ) : (
                                                (() => {
                                                    const available = getAvailableStock(product._id);
                                                    return (
                                                        <p className={`text-[10px] ${available <= 0 ? "text-red-500" : available <= 3 ? "text-amber-500" : "text-gray-400"}`}>
                                                            {available <= 0 ? "Out of stock" : `Stock: ${available}`}
                                                        </p>
                                                    );
                                                })()
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Cart Panel */}
            <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-gray-200 shrink-0">
                {/* Cart Header + Customer */}
                <div className="p-3 border-b border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Current Sale</h2>
                        <button onClick={() => { setCart([]); setSelectedCustomer(null); setCustomerPhone(""); }} className="text-xs text-red-500 hover:text-red-700">Clear All</button>
                    </div>

                    {/* Quick Phone Input */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Customer Phone</label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Icon icon="solar:phone-bold" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    placeholder="Enter phone number..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {customerLookupLoading && (
                                    <Icon icon="svg-spinners:ring-resize" width={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                )}
                            </div>
                            {!selectedCustomer && customerPhone.length >= 3 && !customerLookupLoading && (
                                <button
                                    onClick={handleQuickCreateCustomer}
                                    className="px-3 py-2 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shrink-0"
                                >
                                    + Add
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Customer Info */}
                    {selectedCustomer && (
                        <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
                                <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                            </div>
                            <div className="text-right">
                                {walletBalance > 0 && (
                                    <p className="text-xs text-emerald-600 font-medium">Wallet: ৳{walletBalance.toFixed(2)}</p>
                                )}
                                {selectedCustomer.dueAmount > 0 && (
                                    <p className="text-xs text-red-500 font-medium">Due: ৳{selectedCustomer.dueAmount.toFixed(2)}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-3">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Icon icon="solar:cart-bold" width={48} className="text-gray-200 mb-2" />
                            <p className="text-sm">Cart is empty</p>
                            <p className="text-xs text-gray-400 mt-1">Scan barcode or click product</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.map((item, idx) => (
                                <div key={`${item.productId}-${item.variantId || idx}`} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {item.image ? (
                                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon icon="solar:box-bold" width={16} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                        {item.variantLabel && <p className="text-[10px] text-blue-600 truncate">{item.variantLabel}</p>}
                                        <p className="text-xs text-gray-500">৳{item.price} × {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs">-</button>
                                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs">+</button>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 w-16 text-right shrink-0">৳{item.subtotal.toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 shrink-0">
                                        <Icon icon="mdi:close" width={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Summary */}
                <div className="p-3 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">৳{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Discount</span>
                            <span className="font-medium text-red-600">-৳{discount.toFixed(2)}</span>
                        </div>
                    )}
                    {walletUsedAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Wallet Used</span>
                            <span className="font-medium text-emerald-600">-৳{walletUsedAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                        <span>{remainingAfterWallet <= 0 ? "Fully Paid" : "Remaining"}</span>
                        <span className={remainingAfterWallet <= 0 ? "text-emerald-600" : "text-emerald-600"}>৳{remainingAfterWallet.toFixed(2)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-3 space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Discount"
                            value={discount || ""}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    {selectedCustomer && walletBalance > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useWallet}
                                onChange={(e) => setUseWallet(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700">
                                Use wallet (৳{walletBalance.toFixed(2)})
                                {walletBalance >= total && cart.length > 0 && (
                                    <span className="text-emerald-600 font-medium"> — covers full amount</span>
                                )}
                            </span>
                        </label>
                    )}
                    <button
                        onClick={handlePayNow}
                        disabled={cart.length === 0}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {walletCoversAll
                            ? "COMPLETE SALE"
                            : remainingAfterWallet <= 0
                                ? "COMPLETE SALE"
                                : effectiveWalletUse
                                    ? `PAY ৳${remainingAfterWallet.toFixed(2)}`
                                    : `PAY NOW — ৳${total.toFixed(2)}`}
                    </button>
                </div>
            </div>

            {/* Variant Selection Modal */}
            {showVariantModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div>
                                <h2 className="text-lg font-semibold">{showVariantModal.title}</h2>
                                <p className="text-sm text-gray-500">Select a variant</p>
                            </div>
                            <button onClick={() => setShowVariantModal(null)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="mdi:close" width={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-2">
                                {showVariantModal.variants.map(variant => {
                                    const stock = parseInt(variant.quantity) || 0;
                                    const available = getAvailableStock(showVariantModal._id, variant.id);
                                    const price = parseFloat(variant.price) || showVariantModal.sellingprice;
                                    const variantLabel = Object.entries(variant.options).map(([, v]) => v).join(" / ");
                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => addVariantToCart(showVariantModal, variant)}
                                            disabled={available <= 0}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
                                        >
                                            <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                                {variant.image ? (
                                                    <img src={variant.image} alt="" className="w-full h-full object-cover" />
                                                ) : showVariantModal.image ? (
                                                    <img src={showVariantModal.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Icon icon="solar:box-bold" width={24} className="text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{variantLabel}</p>
                                                {variant.sku && <p className="text-xs text-gray-400">SKU: {variant.sku}</p>}
                                                <p className={`text-xs ${available <= 0 ? "text-red-500" : available <= 3 ? "text-amber-500" : "text-gray-400"}`}>
                                                    {available <= 0 ? "Out of stock" : `Stock: ${available}`}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold text-emerald-600 shrink-0">৳{price.toFixed(2)}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Payment</h2>
                            <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600">
                                <Icon icon="mdi:close" width={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Amount Due</p>
                                <p className="text-3xl font-bold text-emerald-600">৳{remainingAfterWallet.toFixed(2)}</p>
                                {walletUsedAmount > 0 && (
                                    <p className="text-xs text-emerald-500 mt-1">(৳{walletUsedAmount.toFixed(2)} paid from wallet)</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {["cash", "card", "mobile", "bank"].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMethod(m)}
                                            className={`p-2 rounded-lg border text-sm font-medium capitalize transition-all ${
                                                paymentMethod === m
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <Icon icon={m === "cash" ? "solar:money-bold" : m === "card" ? "solar:credit-card-bold" : m === "mobile" ? "solar:smartphone-bold" : "solar:bank-bold"} width={18} className="mx-auto mb-1" />
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    placeholder={remainingAfterWallet.toFixed(2)}
                                    className="w-full px-3 py-2.5 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {finalPaidAmount > 0 && finalPaidAmount < remainingAfterWallet && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                                    <p className="text-yellow-800">Due: ৳{(remainingAfterWallet - finalPaidAmount).toFixed(2)}</p>
                                </div>
                            )}

                            {overpayAmount > 0 && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                                    <p className="text-emerald-800">৳{overpayAmount.toFixed(2)} will be added to customer wallet</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={() => setShowPayment(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCheckout}
                                    disabled={saving}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
                                >
                                    {saving ? "Processing..." : "Complete Sale"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

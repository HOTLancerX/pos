import { addHook, type PluginMeta } from "@/hook";
import Dashboard from "./pages/Dashboard";
import CustomerList from "./pages/CustomerList";
import SupplierList from "./pages/SupplierList";
import BrandList from "./pages/BrandList";
import UnitList from "./pages/UnitList";
import ProductList from "./pages/ProductList";
import CategoryList from "./pages/CategoryList";
import InventoryList from "./pages/InventoryList";
import PurchaseList from "./pages/PurchaseList";
import SaleList from "./pages/SaleList";
import PaymentList from "./pages/PaymentList";
import ExpenseList from "./pages/ExpenseList";
import IncomeList from "./pages/IncomeList";
import ReportPage from "./pages/ReportPage";
import BarcodePage from "./pages/BarcodePage";
import SettingsPage from "./pages/SettingsPage";
import ActivityLogPage from "./pages/ActivityLogPage";

export const PLUGINS: PluginMeta = {
    nx: "com.system.pos",
    name: "pos",
    version: "1.0.0",
    description: "Complete Point of Sale (POS) system with sales, purchases, inventory, payments, and reports.",
    author: "System",
    path: "",
    icon: "solar:shop-bold",
    color: "from-violet-500 to-purple-600",
};

export function register() {
    // ─── Admin nav: POS top-level parent ──────────────────────────────────────
    addHook("admin.nav", [
        {
            key: "pos",
            label: "POS",
            icon: "solar:shop-bold",
            slug: "pos",
            parent: "",
            position: 5,
        },
        {
            key: "pos-dashboard",
            label: "Dashboard",
            icon: "solar:home-bold",
            slug: "pos/dashboard",
            parent: "pos",
            position: 1,
        },
        {
            key: "pos-products",
            label: "Products",
            icon: "solar:box-bold",
            slug: "pos/products",
            parent: "pos",
            position: 2,
        },
        {
            key: "pos-categories",
            label: "Categories",
            icon: "solar:folder-with-files-bold",
            slug: "pos/categories",
            parent: "pos",
            position: 3,
        },
        {
            key: "pos-brands",
            label: "Brands",
            icon: "solar:tag-bold",
            slug: "pos/brands",
            parent: "pos",
            position: 4,
        },
        {
            key: "pos-units",
            label: "Units",
            icon: "solar:ruler-bold",
            slug: "pos/units",
            parent: "pos",
            position: 5,
        },
        {
            key: "pos-customers",
            label: "Customers",
            icon: "solar:users-group-bold",
            slug: "pos/customers",
            parent: "pos",
            position: 10,
        },
        {
            key: "pos-suppliers",
            label: "Suppliers",
            icon: "solar:delivery-bold",
            slug: "pos/suppliers",
            parent: "pos",
            position: 11,
        },
        {
            key: "pos-inventory",
            label: "Inventory",
            icon: "solar:box-minimalistic-bold",
            slug: "pos/inventory",
            parent: "pos",
            position: 20,
        },
        {
            key: "pos-purchases",
            label: "Purchases",
            icon: "solar:shop-2-bold",
            slug: "pos/purchases",
            parent: "pos",
            position: 30,
        },
        {
            key: "pos-sales",
            label: "Sales (POS)",
            icon: "solar:cart-large-bold",
            slug: "pos/sales",
            parent: "pos",
            position: 40,
        },
        {
            key: "pos-payments",
            label: "Payments",
            icon: "solar:wallet-money-bold",
            slug: "pos/payments",
            parent: "pos",
            position: 50,
        },
        {
            key: "pos-expenses",
            label: "Expenses",
            icon: "solar:money-bold",
            slug: "pos/expenses",
            parent: "pos",
            position: 60,
        },
        {
            key: "pos-income",
            label: "Income",
            icon: "solar:chart-bold",
            slug: "pos/income",
            parent: "pos",
            position: 70,
        },
        {
            key: "pos-reports",
            label: "Reports",
            icon: "solar:document-text-bold",
            slug: "pos/reports",
            parent: "pos",
            position: 80,
        },
        {
            key: "pos-barcode",
            label: "Barcode",
            icon: "solar:barcode-bold",
            slug: "pos/barcode",
            parent: "pos",
            position: 90,
        },
        {
            key: "pos-activity",
            label: "Activity Log",
            icon: "solar:history-bold",
            slug: "pos/activity",
            parent: "pos",
            position: 95,
        },
        {
            key: "pos-settings",
            label: "Settings",
            icon: "solar:settings-bold",
            slug: "pos/settings",
            parent: "pos",
            position: 99,
        },
    ], PLUGINS.nx);

    // ─── Admin pages ──────────────────────────────────────────────────────────
    addHook("admin.pages", [
        {
            key: "pos/dashboard",
            label: "POS Dashboard",
            type: "pos",
            style: "left",
            position: 10,
            path: Dashboard,
        },
        {
            key: "pos/customers",
            label: "Customers",
            type: "pos",
            style: "left",
            position: 20,
            path: CustomerList,
        },
        {
            key: "pos/suppliers",
            label: "Suppliers",
            type: "pos",
            style: "left",
            position: 30,
            path: SupplierList,
        },
        {
            key: "pos/brands",
            label: "Brands",
            type: "pos",
            style: "left",
            position: 40,
            path: BrandList,
        },
        {
            key: "pos/units",
            label: "Units",
            type: "pos",
            style: "left",
            position: 50,
            path: UnitList,
        },
        {
            key: "pos/products",
            label: "POS Products",
            type: "pos",
            style: "left",
            position: 60,
            path: ProductList,
        },
        {
            key: "pos/categories",
            label: "POS Categories",
            type: "pos",
            style: "left",
            position: 70,
            path: CategoryList,
        },
        {
            key: "pos/inventory",
            label: "Inventory",
            type: "pos",
            style: "left",
            position: 80,
            path: InventoryList,
        },
        {
            key: "pos/purchases",
            label: "Purchases",
            type: "pos",
            style: "left",
            position: 90,
            path: PurchaseList,
        },
        {
            key: "pos/sales",
            label: "Sales (POS)",
            type: "pos",
            style: "left",
            position: 100,
            path: SaleList,
        },
        {
            key: "pos/payments",
            label: "Payments",
            type: "pos",
            style: "left",
            position: 110,
            path: PaymentList,
        },
        {
            key: "pos/expenses",
            label: "Expenses",
            type: "pos",
            style: "left",
            position: 120,
            path: ExpenseList,
        },
        {
            key: "pos/income",
            label: "Income",
            type: "pos",
            style: "left",
            position: 130,
            path: IncomeList,
        },
        {
            key: "pos/reports",
            label: "Reports",
            type: "pos",
            style: "left",
            position: 140,
            path: ReportPage,
        },
        {
            key: "pos/barcode",
            label: "Barcode Generator",
            type: "pos",
            style: "left",
            position: 150,
            path: BarcodePage,
        },
        {
            key: "pos/activity",
            label: "Activity Log",
            type: "pos",
            style: "left",
            position: 160,
            path: ActivityLogPage,
        },
        {
            key: "pos/settings",
            label: "POS Settings",
            type: "pos",
            style: "left",
            position: 170,
            path: SettingsPage,
        },
    ], PLUGINS.nx);
}

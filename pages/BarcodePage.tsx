"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function BarcodePage() {
    const [barcode, setBarcode] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [generated, setGenerated] = useState<string[]>([]);

    const generateBarcode = () => {
        const codes: string[] = [];
        for (let i = 0; i < quantity; i++) {
            const code = barcode || (Date.now().toString() + Math.random().toString().substring(2, 8));
            codes.push(code);
        }
        setGenerated(codes);
    };

    const printBarcodes = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        printWindow.document.write(`
            <html><head><title>Barcodes</title><style>
                body { font-family: monospace; display: flex; flex-wrap: wrap; gap: 10px; padding: 20px; }
                .barcode { text-align: center; border: 1px solid #000; padding: 10px; }
                .barcode-lines { width: 100px; height: 40px; margin: 0 auto 5px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px); }
            </style></head><body>
            ${generated.map(code => `<div class="barcode"><div class="barcode-lines"></div><div>${code}</div></div>`).join("")}
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Barcode Generator</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / SKU</label>
                        <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Leave empty for auto-generate" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min={1} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex items-end gap-2">
                        <button onClick={generateBarcode} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2">
                            <Icon icon="solar:barcode-bold" width={18} /> Generate
                        </button>
                        {generated.length > 0 && (
                            <button onClick={printBarcodes} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:shadow-md transition-all flex items-center gap-2">
                                <Icon icon="solar:printer-bold" width={18} /> Print
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {generated.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Barcodes ({generated.length})</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {generated.map((code, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-3 text-center">
                                <div className="w-full h-16 bg-gradient-to-b from-gray-900 to-gray-700 rounded mb-2 flex items-center justify-center">
                                    <div className="w-3/4 h-12 bg-[repeating-linear-gradient(90deg,#fff_0px,#fff_1px,transparent_1px,transparent_3px)]" />
                                </div>
                                <p className="text-xs font-mono text-gray-600 break-all">{code}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

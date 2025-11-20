// src/components/products/VariantPriceEditor.tsx

import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import {AdminProductVariant, ProductPricePayload} from "../../../services/productService";

const ALLOWED_CURRENCIES = ["USD", "EUR", "INR"] as const;

interface Props {
    variantIndex: number;
    variants: (AdminProductVariant | any)[];
    setVariants: (updater: (prev: (AdminProductVariant | any)[]) => (AdminProductVariant | any)[]) => void;
    disabled?: boolean;
}

export default function VariantPriceEditor({variantIndex, variants, setVariants, disabled = false}: Props) {
    const variant = variants[variantIndex] ?? {prices: []};

    const addPrice = () => {
        setVariants(prev => {
            const updated = [...prev];
            updated[variantIndex] = {
                ...updated[variantIndex],
                prices: [...(updated[variantIndex]?.prices || []), {
                    currency: "USD",
                    price: 0,
                    is_active: true
                } as ProductPricePayload],
            };
            return updated;
        });
    };

    const removePrice = (idx: number) => {
        setVariants(prev => {
            const updated = [...prev];
            updated[variantIndex] = {
                ...updated[variantIndex],
                prices: updated[variantIndex].prices.filter((_: any, i: number) => i !== idx),
            };
            return updated;
        });
    };

    const updatePriceField = (idx: number, field: keyof ProductPricePayload, value: any) => {
        setVariants(prev => {
            const updated = [...prev];
            const prices = [...(updated[variantIndex]?.prices || [])];
            prices[idx] = {...prices[idx], [field]: value};
            updated[variantIndex] = {...updated[variantIndex], prices};
            return updated;
        });
    };

    return (
        <div className="space-y-2">
            <Label>Prices</Label>
            {(variant.prices || []).map((p: ProductPricePayload, idx: number) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                        <Label>Currency</Label>
                        <select
                            value={p.currency}
                            disabled={disabled}
                            onChange={(e) => updatePriceField(idx, "currency", e.target.value)}
                            className="w-full rounded-md border px-2 py-1"
                        >
                            {ALLOWED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="col-span-5">
                        <Label>Price</Label>
                        <Input
                            type="number"
                            value={p.price as any}
                            disabled={disabled}
                            onChange={(e) => updatePriceField(idx, "price", Number(e.target.value))}
                        />
                    </div>

                    <div className="col-span-2">
                        <Label>Active</Label>
                        <select
                            value={p.is_active ? "1" : "0"}
                            disabled={disabled}
                            onChange={(e) => updatePriceField(idx, "is_active", e.target.value === "1")}
                            className="w-full rounded-md border px-2 py-1"
                        >
                            <option value="1">Yes</option>
                            <option value="0">No</option>
                        </select>
                    </div>

                    <div className="col-span-1">
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removePrice(idx)}
                                className="text-sm text-red-500"
                                title="Remove price"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {!disabled && (
                <div>
                    <button type="button" onClick={addPrice}
                            className="mt-2 px-3 py-1 rounded bg-green-600 text-white text-sm">
                        + Add Price
                    </button>
                </div>
            )}
        </div>
    );
}

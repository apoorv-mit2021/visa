// src/components/products/VariantAttributeEditor.tsx
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import {AdminProductVariant, ProductAttributePayload} from "../../../services/productService";

interface Props {
    variantIndex: number;
    variants: (AdminProductVariant | any)[];
    setVariants: (updater: (prev: (AdminProductVariant | any)[]) => (AdminProductVariant | any)[]) => void;
    disabled?: boolean;
}

export default function VariantAttributeEditor({variantIndex, variants, setVariants, disabled = false}: Props) {
    const variant = variants[variantIndex] ?? {attributes: []};

    const addAttribute = () => {
        setVariants(prev => {
            const updated = [...prev];
            updated[variantIndex] = {
                ...updated[variantIndex],
                attributes: [...(updated[variantIndex]?.attributes || []), {
                    name: "",
                    value: "",
                    is_active: true
                } as ProductAttributePayload]
            };
            return updated;
        });
    };

    const removeAttribute = (idx: number) => {
        setVariants(prev => {
            const updated = [...prev];
            updated[variantIndex] = {
                ...updated[variantIndex],
                attributes: updated[variantIndex].attributes.filter((_: any, i: number) => i !== idx),
            };
            return updated;
        });
    };

    const updateAttributeField = (idx: number, field: keyof ProductAttributePayload, value: any) => {
        setVariants(prev => {
            const updated = [...prev];
            const attrs = [...(updated[variantIndex]?.attributes || [])];
            attrs[idx] = {...attrs[idx], [field]: value};
            updated[variantIndex] = {...updated[variantIndex], attributes: attrs};
            return updated;
        });
    };

    return (
        <div className="space-y-2">
            <Label>Attributes</Label>
            {(variant.attributes || []).map((a: ProductAttributePayload, idx: number) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                        <Label>Name</Label>
                        <Input
                            value={a.name}
                            disabled={disabled}
                            onChange={(e) => updateAttributeField(idx, "name", e.target.value)}
                        />
                    </div>

                    <div className="col-span-6">
                        <Label>Value</Label>
                        <Input
                            value={a.value}
                            disabled={disabled}
                            onChange={(e) => updateAttributeField(idx, "value", e.target.value)}
                        />
                    </div>

                    <div className="col-span-1">
                        {!disabled && (
                            <button type="button" onClick={() => removeAttribute(idx)}
                                    className="text-red-500">✕</button>
                        )}
                    </div>
                </div>
            ))}

            {!disabled && (
                <div>
                    <button type="button" onClick={addAttribute}
                            className="mt-2 px-3 py-1 rounded bg-green-600 text-white text-sm">
                        + Add Attribute
                    </button>
                </div>
            )}
        </div>
    );
}

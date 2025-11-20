import {useState, useEffect, FormEvent} from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Switch from "../../../components/form/switch/Switch";

import {
    AdminProductDetail,
    AdminProductVariant,
    CreateProductPayload,
    CreateProductVariantPayload,
    UpdateProductPayload,
    UpdateProductVariantPayload,
    // ProductPricePayload,
    // ProductAttributePayload,
} from "../../../services/productService";
import VariantPriceEditor from "./VariantPriceEditor.tsx";
import VariantAttributeEditor from "./VariantAttributeEditor.tsx";
import VariantImageEditor from "./VariantImageEditor.tsx";

export type ProductFormMode = "create" | "view" | "edit";

interface ProductFormProps {
    mode?: ProductFormMode;
    product?: AdminProductDetail;
    isSubmitting?: boolean;
    onSubmit: (
        data: CreateProductPayload | { id: number; data: UpdateProductPayload }
    ) => void;
}

export default function ProductForm({
                                        mode = "create",
                                        product,
                                        isSubmitting = false,
                                        onSubmit
                                    }: ProductFormProps) {

    // ---------------------------------------
    // PRODUCT FORM STATE
    // ---------------------------------------
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [isActive, setIsActive] = useState(true);

    // Variants array
    const [variants, setVariants] = useState<AdminProductVariant[] | CreateProductVariantPayload[]>([]);

    const [isEditing, setIsEditing] = useState(mode === "edit");

    // ---------------------------------------
    // PREFILL
    // ---------------------------------------
    useEffect(() => {
        if (product && (mode === "view" || mode === "edit")) {
            setName(product.name);
            setSlug(product.slug);
            setDescription(product.description || "");
            setCategory(product.category);
            setIsActive(product.is_active);
            setVariants(product.variants);
            setIsEditing(mode === "edit");
        } else {
            setName("");
            setSlug("");
            setDescription("");
            setCategory("");
            setIsActive(true);
            setVariants([]);
            setIsEditing(true);
        }
    }, [product, mode]);

    const inputsDisabled = mode !== "create" && !isEditing;

    // ---------------------------------------
    // MUTATIONS FOR VARIANTS
    // ---------------------------------------

    const updateVariantField = (index: number, field: string, value: any) => {
        setVariants(prev => {
            const updated = [...prev];
            updated[index] = {...updated[index], [field]: value};
            return updated;
        });
    };

    const addVariant = () => {
        const newVariant: CreateProductVariantPayload = {
            sku: "",
            name: "",
            slug: "",
            stock_quantity: 0,
            is_default: false,
            is_active: true,
            prices: [],
            images: [],
            attributes: []
        };
        setVariants(prev => [...prev, newVariant]);
    };

    const removeVariant = (index: number) => {
        setVariants(prev => prev.filter((_, i) => i !== index));
    };

    // ---------------------------------------
    // SUBMIT HANDLER
    // ---------------------------------------
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (mode === "create") {
            const payload: CreateProductPayload = {
                name,
                slug,
                description,
                category,
                variants: variants as CreateProductVariantPayload[],
            };
            return onSubmit(payload);
        }

        if (product && isEditing) {
            const data: UpdateProductPayload = {};

            if (name !== product.name) data.name = name;
            if (slug !== product.slug) data.slug = slug;
            if (description !== product.description) data.description = description;
            if (category !== product.category) data.category = category;
            if (isActive !== product.is_active) data.is_active = isActive;

            data.variants = variants as UpdateProductVariantPayload[];

            return onSubmit({id: product.id, data});
        }
    };

    // ---------------------------------------
    // RENDER
    // ---------------------------------------
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="product-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* NAME */}
                    <div>
                        <Label>Product Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={inputsDisabled}
                            required
                        />
                    </div>

                    {/* SLUG */}
                    <div>
                        <Label>Slug</Label>
                        <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            disabled={inputsDisabled}
                            required
                        />
                    </div>

                    {/* CATEGORY */}
                    <div>
                        <Label>Category</Label>
                        <Input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <Label>Description</Label>
                        <TextArea
                            rows={4}
                            value={description}
                            onChange={(v) => setDescription(v)}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* STATUS */}
                    {mode !== "create" && (
                        <div className="flex justify-between items-center">
                            <Label>Status</Label>
                            <Switch
                                label={isActive ? "Active" : "Inactive"}
                                checked={isActive}
                                onChange={setIsActive}
                                disabled={!isEditing}
                            />
                        </div>
                    )}

                    {/* --------------------------------------- */}
                    {/* VARIANTS */}
                    {/* --------------------------------------- */}
                    <div className="mt-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Variants</Label>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                                >
                                    + Add Variant
                                </button>
                            )}
                        </div>

                        {variants.map((variant, index) => (
                            <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 p-4 space-y-4 shadow-sm">

                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium">Variant #{index + 1}</h3>
                                        {"name" in variant && variant.name && (
                                            <div className="text-xs text-gray-500">{variant.name}</div>
                                        )}
                                    </div>

                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            className="text-xs px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {/* Basic details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* SKU */}
                                    <div>
                                        <Label>SKU</Label>
                                        <Input
                                            value={variant.sku}
                                            disabled={inputsDisabled}
                                            onChange={(e) =>
                                                updateVariantField(index, "sku", e.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <Label>Name</Label>
                                        <Input
                                            value={variant.name || ""}
                                            disabled={inputsDisabled}
                                            onChange={(e) =>
                                                updateVariantField(index, "name", e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Stock */}
                                    <div>
                                        <Label>Stock Quantity</Label>
                                        <Input
                                            type="number"
                                            value={variant.stock_quantity}
                                            disabled={inputsDisabled}
                                            onChange={(e) =>
                                                updateVariantField(index, "stock_quantity", Number(e.target.value))
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="flex flex-wrap items-center gap-6">
                                    <Switch
                                        label="Is Default Variant"
                                        checked={variant.is_default}
                                        disabled={inputsDisabled}
                                        onChange={(v) =>
                                            updateVariantField(index, "is_default", v)
                                        }
                                    />
                                    <Switch
                                        label="Is Active"
                                        checked={variant.is_active}
                                        disabled={inputsDisabled}
                                        onChange={(v) =>
                                            updateVariantField(index, "is_active", v)
                                        }
                                    />
                                </div>

                                {/* PRICE LIST */}
                                <VariantPriceEditor
                                    variantIndex={index}
                                    variants={variants}
                                    setVariants={setVariants}
                                    disabled={inputsDisabled}
                                />

                                {/* ATTRIBUTES */}
                                <VariantAttributeEditor
                                    variantIndex={index}
                                    variants={variants}
                                    setVariants={setVariants}
                                    disabled={inputsDisabled}
                                />

                                {/* IMAGES (upload UI) */}
                                <VariantImageEditor
                                    variant={variant}
                                    disabled={inputsDisabled}
                                    setVariants={setVariants}
                                    variantIndex={index}
                                />
                            </div>
                        ))}

                    </div>
                </form>
            </div>

            {/* FOOTER BUTTONS */}
            <div className="flex justify-end gap-2 border-t px-6 py-4">
                {mode === "create" ? (
                    <>
                        <button
                            type="reset"
                            className="rounded px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700"
                            onClick={() => {
                                setName("");
                                setSlug("");
                                setDescription("");
                                setCategory("");
                                setVariants([]);
                                setIsActive(true);
                            }}
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            form="product-form"
                            disabled={isSubmitting}
                            className="rounded px-4 py-2 text-sm bg-blue-600 text-white"
                        >
                            {isSubmitting ? "Creating..." : "Create Product"}
                        </button>
                    </>
                ) : !isEditing ? (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded px-4 py-2 text-sm bg-blue-600 text-white"
                    >
                        Edit
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                if (product) {
                                    setName(product.name);
                                    setSlug(product.slug);
                                    setDescription(product.description || "");
                                    setCategory(product.category);
                                    setIsActive(product.is_active);
                                    setVariants(product.variants);
                                }
                                setIsEditing(false);
                            }}
                            className="rounded px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="product-form"
                            disabled={isSubmitting}
                            className="rounded px-4 py-2 text-sm bg-blue-600 text-white"
                        >
                            {isSubmitting ? "Updating..." : "Update Product"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

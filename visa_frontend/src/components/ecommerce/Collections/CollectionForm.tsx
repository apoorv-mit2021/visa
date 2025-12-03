// src/components/collections/CollectionForm.tsx

import {useEffect, useMemo, useState, FormEvent} from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Switch from "../../../components/form/switch/Switch";
import type {Collection, CollectionUpdate} from "../../../services/collectionService";
import {listProducts, type Product} from "../../../services/productService";
import {useAuth} from "../../../context/AuthContext";

export type CollectionMode = "create" | "view" | "edit";

interface CollectionFormProps {
    mode?: CollectionMode;
    collection?: Collection;
    isSubmitting?: boolean;
    onSubmit: (
        data:
            | { name: string; description?: string; is_active?: boolean; show_on_landing?: boolean; product_ids?: number[] }
            | { id: number; data: CollectionUpdate }
    ) => void;
}

export default function CollectionForm({
                                           mode = "create",
                                           collection,
                                           isSubmitting = false,
                                           onSubmit,
                                       }: CollectionFormProps) {
    const {token} = useAuth();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [showOnLanding, setShowOnLanding] = useState(false);
    const [isEditing, setIsEditing] = useState(mode === "edit");

    // Products linking state
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

    // Prefill data
    useEffect(() => {
        if (collection && (mode === "view" || mode === "edit")) {
            setName(collection.name || "");
            setDescription(collection.description || "");
            setIsActive(Boolean(collection.is_active));
            setShowOnLanding(Boolean(collection.show_on_landing));
            setIsEditing(mode === "edit");
            setSelectedProductIds(collection.product_ids || []);
        } else if (mode === "create") {
            setName("");
            setDescription("");
            setIsActive(true);
            setShowOnLanding(false);
            setIsEditing(true);
            setSelectedProductIds([]);
        }
    }, [collection, mode]);

    const inputsDisabled = mode !== "create" && !isEditing;

    // Fetch products (basic list + optional search)
    useEffect(() => {
        let cancelled = false;
        const fetchProducts = async () => {
            if (!token) return;
            try {
                const products = await listProducts(token, {
                    search: productSearch || undefined,
                    // Backend enforces limit <= 200; request the max allowed
                    limit: 200,
                });
                if (!cancelled) setAvailableProducts(products);
            } catch {
                // Silent fail for now; could add toast if desired
            }
        };
        fetchProducts();
        return () => {
            cancelled = true;
        };
    }, [token, productSearch]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return availableProducts;
        const q = productSearch.toLowerCase();
        return availableProducts.filter(p =>
            p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
        );
    }, [availableProducts, productSearch]);

    const toggleProductSelection = (id: number) => {
        if (inputsDisabled) return;
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (mode === "create") {
            onSubmit({
                name,
                description: description || undefined,
                is_active: isActive,
                show_on_landing: showOnLanding,
                product_ids: selectedProductIds,
            });
            return;
        }

        if (isEditing && collection) {
            const updateData: CollectionUpdate = {};
            if (name !== collection.name) updateData.name = name;
            if (description !== collection.description)
                updateData.description = description || undefined;
            if (isActive !== Boolean(collection.is_active))
                updateData.is_active = isActive;
            if (showOnLanding !== Boolean(collection.show_on_landing))
                updateData.show_on_landing = showOnLanding;

            // only include product_ids if changed
            const prevIds = collection.product_ids || [];
            const sameLength = prevIds.length === selectedProductIds.length;
            const sameSet = sameLength && prevIds.every(id => selectedProductIds.includes(id));
            if (!sameSet) updateData.product_ids = selectedProductIds;

            onSubmit({id: collection.id, data: updateData});
        }
    };

    return (
        <div className="flex flex-col h-full">

            <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="collection-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* Name */}
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Collection name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={inputsDisabled}
                            required
                        />
                    </div>

                    {/* Slug (READ-ONLY, VIEW ONLY) */}
                    {collection && mode !== "create" && (
                        <div>
                            <Label>Slug</Label>
                            <Input
                                type="text"
                                value={collection.slug}
                                disabled
                                className="bg-gray-100 dark:bg-gray-800"
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <TextArea
                            rows={5}
                            value={description}
                            onChange={(value) => setDescription(value)}
                            disabled={inputsDisabled}
                            placeholder="Optional description"
                        />
                    </div>

                    {/* Linked Products */}
                    <div>
                        <div className="flex items-center justify-between gap-4">
                            <Label>Linked Products</Label>
                            {!inputsDisabled && (
                                <Input
                                    type="text"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                />
                            )}
                        </div>

                        {/* View mode: show chips of product names */}
                        {inputsDisabled ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedProductIds.length === 0 ? (
                                    <span className="text-sm text-gray-500">No products linked</span>
                                ) : (
                                    selectedProductIds.map(pid => {
                                        const p = availableProducts.find(ap => ap.id === pid);
                                        return (
                                            <span key={pid}
                                                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                {p ? p.name : `#${pid}`}
                                            </span>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            <div className="mt-3 max-h-64 overflow-y-auto border rounded-md divide-y dark:border-gray-800">
                                {filteredProducts.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500">No products found</div>
                                ) : (
                                    filteredProducts.map((p) => (
                                        <label key={p.id}
                                               className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4"
                                                checked={selectedProductIds.includes(p.id)}
                                                onChange={() => toggleProductSelection(p.id)}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{p.name}</span>
                                                <span className="text-xs text-gray-500">{p.category}</span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status toggle */}
                    {mode !== "create" && (
                        <div className="flex items-center justify-between">
                            <Label>Status</Label>
                            <Switch
                                label={isActive ? "Active" : "Inactive"}
                                checked={isActive}
                                onChange={(checked) => setIsActive(checked)}
                                disabled={!isEditing}
                            />
                        </div>
                    )}

                    {/* Show on Landing toggle */}
                    {mode !== "create" && (
                        <div className="flex items-center justify-between">
                            <Label>Show on Landing</Label>
                            <Switch
                                label={showOnLanding ? "Visible" : "Hidden"}
                                checked={showOnLanding}
                                onChange={(checked) => setShowOnLanding(checked)}
                                disabled={!isEditing}
                            />
                        </div>
                    )}

                </form>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                {mode === "create" ? (
                    <>
                        <button
                            type="reset"
                            onClick={() => {
                                setName("");
                                setDescription("");
                                setIsActive(true);
                                setShowOnLanding(false);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            form="collection-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "Creating..." : "Create Collection"}
                        </button>
                    </>
                ) : !isEditing ? (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Edit
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                if (collection) {
                                    setName(collection.name);
                                    setDescription(collection.description || "");
                                    setIsActive(Boolean(collection.is_active));
                                    setShowOnLanding(Boolean(collection.show_on_landing));
                                }
                                setIsEditing(false);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="collection-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "Updating..." : "Update"}
                        </button>
                    </>
                )}
            </div>

        </div>
    );
}

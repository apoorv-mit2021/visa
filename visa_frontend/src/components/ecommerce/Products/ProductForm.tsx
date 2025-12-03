import {useState, useEffect, FormEvent, ChangeEvent} from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Switch from "../../../components/form/switch/Switch";

import {
    Product,
    ProductCreatePayload,
    ProductUpdatePayload,
    ProductSize,
    CURRENCIES,
    DEFAULT_CURRENCY,
    getProductCategories,
    type ProductCategoryOption,
} from "../../../services/productService";
import {useAuth} from "../../../context/AuthContext";
import { uploadMultipleProductImages } from "../../../services/imageUploadService";

export type ProductFormMode = "create" | "view" | "edit";

interface ProductFormProps {
    mode?: ProductFormMode;
    product?: Product;
    isSubmitting?: boolean;
    onSubmit: (
        data: ProductCreatePayload | { id: number; data: ProductUpdatePayload }
    ) => void;
}

export default function ProductForm({
                                        mode = "create",
                                        product,
                                        isSubmitting = false,
                                        onSubmit,
                                    }: ProductFormProps) {

    // Fallback thumbnail (inline SVG) for image preview errors or empty URLs
    const FALLBACK_IMAGE =
        "data:image/svg+xml;utf8,"
        + encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
              <rect width='100%' height='100%' fill='%23f3f4f6'/>
              <g fill='%239ca3af'>
                <circle cx='40' cy='46' r='12'/>
                <path d='M12 96l28-28 16 16 20-20 32 32z' fill='%23d1d5db'/>
              </g>
              <text x='50%' y='112' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='10' fill='%239ca3af'>No image</text>
            </svg>`
        );

    // -----------------------------
    // Product state fields
    // -----------------------------
    const [sku, setSku] = useState("");
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [isActive, setIsActive] = useState(true);
    const [rating, setRating] = useState<string>("");

    const [sizes, setSizes] = useState<ProductSize[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<ProductCategoryOption[]>([]);
    const [careInstructions, setCareInstructions] = useState<string[]>([]);
    type DetailKV = { key: string; value: string };
    const [productDetails, setProductDetails] = useState<DetailKV[]>([]);
    // Local edit mode for non-create screens, mirrors CollectionForm behavior
    const [isEditing, setIsEditing] = useState(mode === "edit");
    const inputsDisabled = mode !== "create" && !isEditing;
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    const {token} = useAuth();

    // -----------------------------
    // Prefill (edit/view)
    // -----------------------------
    useEffect(() => {
        if (!product) return;

        if (mode === "edit" || mode === "view") {
            setSku(product.sku);
            setName(product.name);
            setSlug(product.slug);
            setDescription(product.description || "");
            setCategory(product.category);
            setPrice(product.price);
            // product.currency is typed as string in the service, but UI restricts it to allowed CURRENCIES
            setCurrency(product.currency as typeof CURRENCIES[number]);
            setIsActive(product.is_active);
            setRating(typeof product.rating === "number" ? String(product.rating) : "");

            // Backend may return sizes either as an array of { size, stock }
            // or (in some responses) as an object map like { "7 inch": 3 }.
            // Normalize it here to always store ProductSize[] in state.
            {
                const rawSizes = product.sizes as unknown;
                let normalized: ProductSize[] = [];
                if (Array.isArray(rawSizes)) {
                    normalized = rawSizes as ProductSize[];
                } else if (rawSizes && typeof rawSizes === "object") {
                    normalized = Object.entries(rawSizes as Record<string, unknown>).map(([k, v]) => ({
                        size: k,
                        stock: typeof v === "number" ? v : Number(v) || 0,
                    }));
                }
                setSizes(normalized);
            }
            setImages(product.images || []);
            setCareInstructions(product.care_instructions || []);
            setProductDetails(
                product.product_details
                    ? Object.entries(product.product_details).map(([k, v]) => ({key: k, value: v}))
                    : []
            );
            // initialize local editing state based on mode
            setIsEditing(mode === "edit");
        }
    }, [product, mode]);

    // Helper to reset fields from current product (used on Cancel)
    const resetFromProduct = () => {
        if (!product) return;
        setSku(product.sku);
        setName(product.name);
        setSlug(product.slug);
        setDescription(product.description || "");
        setCategory(product.category);
        setPrice(product.price);
        setCurrency(product.currency as typeof CURRENCIES[number]);
        setIsActive(product.is_active);
        setRating(typeof product.rating === "number" ? String(product.rating) : "");
        {
            const rawSizes = product.sizes as unknown;
            let normalized: ProductSize[] = [];
            if (Array.isArray(rawSizes)) {
                normalized = rawSizes as ProductSize[];
            } else if (rawSizes && typeof rawSizes === "object") {
                normalized = Object.entries(rawSizes as Record<string, unknown>).map(([k, v]) => ({
                    size: k,
                    stock: typeof v === "number" ? v : Number(v) || 0,
                }));
            }
            setSizes(normalized);
        }
        setImages(product.images || []);
        setCareInstructions(product.care_instructions || []);
        setProductDetails(
            product.product_details
                ? Object.entries(product.product_details).map(([k, v]) => ({key: k, value: v}))
                : []
        );
    };

    // Fetch product categories for dropdown
    useEffect(() => {
        let ignore = false;
        const loadCategories = async () => {
            if (!token) return;
            try {
                const options = await getProductCategories(token);
                if (ignore) return;
                // Ensure current category exists in options when editing/viewing
                if (category && !options.some(o => o.value === category)) {
                    setCategoryOptions([{value: category, label: category}, ...options]);
                } else {
                    setCategoryOptions(options);
                }
            } catch {
                // Non-blocking: if categories fail to load, keep options empty
                // console.error("Failed to load categories", err);
            }
        };
        loadCategories();
        return () => {
            ignore = true;
        };
        // include token and category so options can ensure current category visibility
    }, [token, category]);

    // -----------------------------
    // Size Editor
    // -----------------------------
    const addSize = () => {
        setSizes(prev => [...prev, {size: "", stock: 0}]);
    };

    // Provide precise typing for updates to avoid `any`
    function updateSize(index: number, field: "size", value: string): void;
    function updateSize(index: number, field: "stock", value: number): void;
    function updateSize(index: number, field: keyof ProductSize, value: string | number): void;
    function updateSize(index: number, field: keyof ProductSize, value: string | number) {
        setSizes(prev => {
            const updated = [...prev];
            updated[index] = {...updated[index], [field]: value};
            return updated;
        });
    }

    const removeSize = (index: number) => {
        setSizes(prev => prev.filter((_, i) => i !== index));
    };

    // -----------------------------
    // Image Editor
    // -----------------------------
    const addImage = () => setImages(prev => [...prev, ""]);
    const updateImage = (i: number, value: string) =>
        setImages(prev => prev.map((img, idx) => (idx === i ? value : img)));
    const removeImage = (i: number) =>
        setImages(prev => prev.filter((_, idx) => idx !== i));

    // Handle image file uploads via backend -> Cloudinary
    const handleImageFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (!files.length) return;
        try {
            setIsUploadingImages(true);
            const urls = await uploadMultipleProductImages(token!, files);
            setImages(prev => [...prev, ...urls]);
        } catch (err) {
            console.error("Image upload failed", err);
            alert("Failed to upload one or more images. Please try again.");
        } finally {
            setIsUploadingImages(false);
            // reset input value to allow re-selecting same files
            e.target.value = "";
        }
    };

    // -----------------------------
    // Care Instructions Editor
    // -----------------------------
    const addCareInstruction = () => setCareInstructions(prev => [...prev, ""]);
    const updateCareInstruction = (i: number, value: string) =>
        setCareInstructions(prev => prev.map((ci, idx) => (idx === i ? value : ci)));
    const removeCareInstruction = (i: number) =>
        setCareInstructions(prev => prev.filter((_, idx) => idx !== i));

    // -----------------------------
    // Product Details Editor (key/value)
    // -----------------------------
    const addProductDetail = () => setProductDetails(prev => [...prev, {key: "", value: ""}]);
    const updateProductDetail = (i: number, field: "key" | "value", value: string) =>
        setProductDetails(prev => prev.map((row, idx) => (idx === i ? {...row, [field]: value} : row)));
    const removeProductDetail = (i: number) =>
        setProductDetails(prev => prev.filter((_, idx) => idx !== i));

    // -----------------------------
    // Collections selection handled via multi-select below
    // -----------------------------

    // -----------------------------
    // Submit handler
    // -----------------------------
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (mode === "create") {
            const parsedRating = rating.trim() === "" ? undefined : Number(rating);
            const detailsObj = productDetails.reduce<Record<string, string>>((acc, {key, value}) => {
                const k = key.trim();
                if (k) acc[k] = value;
                return acc;
            }, {});
            const payload: ProductCreatePayload = {
                sku,
                name,
                description,
                ...(parsedRating !== undefined && !Number.isNaN(parsedRating) ? {rating: parsedRating} : {}),
                price,
                currency,
                category,
                sizes,
                images,
                care_instructions: careInstructions.filter(ci => ci.trim() !== ""),
                product_details: detailsObj,
            };

            return onSubmit(payload);
        }

        // Allow updating when in local editing mode, even if outer mode is "view"
        if (product && isEditing) {
            const data: ProductUpdatePayload = {};

            if (sku !== product.sku) data.sku = sku;
            if (name !== product.name) data.name = name;
            if (description !== product.description) data.description = description;
            if (category !== product.category) data.category = category;
            if (price !== product.price) data.price = price;
            if (currency !== product.currency) data.currency = currency;
            if (isActive !== product.is_active) data.is_active = isActive;
            const parsedRating = rating.trim() === "" ? undefined : Number(rating);
            if (
                (typeof product.rating === "number" || parsedRating !== undefined) &&
                ((parsedRating === undefined && typeof product.rating === "number") ||
                    (parsedRating !== undefined && parsedRating !== product.rating))
            ) {
                data.rating = parsedRating;
            }

            data.sizes = sizes;
            data.images = images;
            data.care_instructions = careInstructions.filter(ci => ci.trim() !== "");
            data.product_details = productDetails.reduce<Record<string, string>>((acc, {key, value}) => {
                const k = key.trim();
                if (k) acc[k] = value;
                return acc;
            }, {});

            return onSubmit({id: product.id, data});
        }
    };

    // -----------------------------
    // Render UI
    // -----------------------------
    return (
        <div className="flex flex-col h-full">
            <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                {/* SKU */}
                <div>
                    <Label>SKU</Label>
                    <Input
                        value={sku}
                        disabled={inputsDisabled}
                        onChange={e => setSku(e.target.value)}
                        required
                    />
                </div>

                {/* Name */}
                <div>
                    <Label>Product Name</Label>
                    <Input
                        value={name}
                        disabled={inputsDisabled}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>

                {/* Slug */}
                <div>
                    <Label>Slug (auto-generated)</Label>
                    <Input value={slug} disabled/>
                </div>

                {/* Category */}
                <div>
                    <Label>Category</Label>
                    <select
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                        value={category}
                        disabled={inputsDisabled}
                        onChange={e => setCategory(e.target.value)}
                    >
                        <option value="" disabled>
                            Select category
                        </option>
                        {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Price */}
                <div>
                    <Label>Price</Label>
                    <Input
                        type="number"
                        value={price}
                        disabled={inputsDisabled}
                        onChange={e => setPrice(Number(e.target.value))}
                    />
                </div>

                {/* Rating */}
                <div>
                    <Label>Rating (0 - 5)</Label>
                    <Input
                        type="number"
                        value={rating}
                        disabled={inputsDisabled}
                        onChange={e => setRating(e.target.value)}
                        min={0}
                        max={5}
                        step={0.1}
                    />
                </div>

                {/* Currency */}
                <div>
                    <Label>Currency</Label>
                    <select
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                        value={currency}
                        disabled={inputsDisabled}
                        onChange={e => setCurrency(e.target.value as (typeof CURRENCIES)[number])}
                    >
                        {CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <Label>Description</Label>
                    <TextArea
                        rows={4}
                        value={description}
                        disabled={inputsDisabled}
                        onChange={val => setDescription(val)}
                    />
                </div>

                {/* Active Toggle */}
                {mode !== "create" && (
                    <Switch
                        label={isActive ? "Active" : "Inactive"}
                        checked={isActive}
                        onChange={setIsActive}
                        disabled={inputsDisabled}
                    />
                )}

                {/* ---------------------------------------- */}
                {/* SIZES */}
                {/* ---------------------------------------- */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label>Sizes</Label>
                        {!inputsDisabled && (
                            <button
                                type="button"
                                onClick={addSize}
                                className="px-2 py-1 text-sm bg-green-600 text-white rounded"
                            >
                                + Add Size
                            </button>
                        )}
                    </div>

                    {sizes.map((s, i) => (
                        <div key={i} className="flex gap-4 items-center bg-gray-50 p-3 rounded">
                            <Input
                                placeholder="Size (e.g. S)"
                                value={s.size}
                                disabled={inputsDisabled}
                                onChange={(e) => updateSize(i, "size", e.target.value)}
                            />
                            <Input
                                type="number"
                                placeholder="Stock"
                                value={s.stock}
                                disabled={inputsDisabled}
                                onChange={(e) => updateSize(i, "stock", Number(e.target.value))}
                            />
                            {!inputsDisabled && (
                                <button
                                    type="button"
                                    onClick={() => removeSize(i)}
                                    className="text-red-500 text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* ---------------------------------------- */}
                {/* IMAGES */}
                {/* ---------------------------------------- */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label>Images (URLs)</Label>
                        {!inputsDisabled && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={addImage}
                                    disabled={isUploadingImages}
                                    className="px-2 py-1 text-sm bg-green-600 text-white rounded disabled:opacity-50"
                                >
                                    + Add URL
                                </button>
                                <label className="px-2 py-1 text-sm bg-indigo-600 text-white rounded cursor-pointer disabled:opacity-50">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageFilesChange}
                                        className="hidden"
                                        disabled={isUploadingImages}
                                    />
                                    Upload Images
                                </label>
                            </div>
                        )}
                    </div>
                    {isUploadingImages && (
                        <div className="text-xs text-gray-500">Uploading images...</div>
                    )}

                    {images.map((img, i) => (
                        <div key={i} className="flex gap-4 items-center bg-gray-50 p-3 rounded">
                            <div className="flex items-center gap-3 min-w-[5rem]">
                                <img
                                    src={img && img.trim() !== "" ? img : FALLBACK_IMAGE}
                                    alt={`Image ${i + 1}`}
                                    className="w-16 h-16 object-cover rounded border border-gray-200 bg-white"
                                    onError={(e) => {
                                        // Prevent infinite loop if fallback somehow errors
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = FALLBACK_IMAGE;
                                    }}
                                />
                            </div>
                            <Input
                                value={img}
                                disabled={inputsDisabled}
                                onChange={(e) => updateImage(i, e.target.value)}
                                placeholder="https://..."
                            />
                            {!inputsDisabled && (
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="text-red-500 text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* ---------------------------------------- */}
                {/* CARE INSTRUCTIONS */}
                {/* ---------------------------------------- */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label>Care Instructions</Label>
                        {!inputsDisabled && (
                            <button
                                type="button"
                                onClick={addCareInstruction}
                                className="px-2 py-1 text-sm bg-green-600 text-white rounded"
                            >
                                + Add Instruction
                            </button>
                        )}
                    </div>

                    {careInstructions.map((ci, i) => (
                        <div key={i} className="flex gap-4 items-center bg-gray-50 p-3 rounded">
                            <Input
                                value={ci}
                                disabled={inputsDisabled}
                                onChange={(e) => updateCareInstruction(i, e.target.value)}
                                placeholder="e.g., Avoid contact with water"
                            />
                            {!inputsDisabled && (
                                <button
                                    type="button"
                                    onClick={() => removeCareInstruction(i)}
                                    className="text-red-500 text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* ---------------------------------------- */}
                {/* PRODUCT DETAILS (Key/Value) */}
                {/* ---------------------------------------- */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label>Product Details</Label>
                        {!inputsDisabled && (
                            <button
                                type="button"
                                onClick={addProductDetail}
                                className="px-2 py-1 text-sm bg-green-600 text-white rounded"
                            >
                                + Add Detail
                            </button>
                        )}
                    </div>

                    {productDetails.map((row, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4 items-center bg-gray-50 p-3 rounded">
                            <Input
                                value={row.key}
                                disabled={inputsDisabled}
                                onChange={(e) => updateProductDetail(i, "key", e.target.value)}
                                placeholder="Key (e.g., Material)"
                            />
                            <Input
                                value={row.value}
                                disabled={inputsDisabled}
                                onChange={(e) => updateProductDetail(i, "value", e.target.value)}
                                placeholder="Value (e.g., 18K Gold)"
                            />
                            {!inputsDisabled && (
                                <div className="col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => removeProductDetail(i)}
                                        className="text-red-500 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </form>

            {/* ---------------------------------------- */}
            {/* FOOTER BUTTONS */}
            {/* ---------------------------------------- */}
            <div className="flex justify-end gap-2 border-t px-6 py-4">
                {mode === "create" ? (
                    <button
                        type="submit"
                        form="product-form"
                        disabled={isSubmitting || isUploadingImages}
                        className="rounded px-4 py-2 text-sm bg-blue-600 text-white disabled:opacity-50"
                    >
                        {isSubmitting ? "Creating..." : isUploadingImages ? "Uploading..." : "Create Product"}
                    </button>
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
                                resetFromProduct();
                                setIsEditing(false);
                            }}
                            className="rounded px-4 py-2 text-sm text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
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

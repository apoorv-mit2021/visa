// src/components/products/VariantImageEditor.tsx
import React, {useMemo, useRef, useState} from "react";
import Label from "../../../components/form/Label";
import {
    AdminProductImage,
    AdminProductVariant,
    uploadVariantImage,
    updateProductImageMetadata,
    replaceProductImageFile,
    deleteProductImage,
    buildMediaUrl
} from "../../../services/productService";

interface Props {
    variant: AdminProductVariant | any;
    disabled?: boolean;
    // optional setter: if provided, we will call it to append image response into the variant's images
    setVariants?: (updater: (prev: any[]) => any[]) => void;
    variantIndex?: number;
}

// Using service functions from productService

export default function VariantImageEditor({variant, disabled = false, setVariants, variantIndex}: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [busyImageIds, setBusyImageIds] = useState<Record<number, boolean>>({});
    const [editState, setEditState] = useState<Record<number, {
        alt_text?: string | null;
        display_order?: number | null;
        is_active?: boolean | null;
    }>>({});
    const [replaceFiles, setReplaceFiles] = useState<Record<number, File | null>>({});

    const hasId = Boolean(variant?.id);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const f = e.target.files?.[0] ?? null;
        setFile(f);
    };

    const upload = async () => {
        if (!file) {
            setError("Please choose a file first.");
            return;
        }
        if (!hasId) {
            setError("Variant must be saved on server before uploading images. Save product/variant first.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            setError("Unauthorized. Please log in.");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const res: AdminProductImage = await uploadVariantImage(
                token,
                variant.id,
                file
            );

            // Append newly created image into the variant in parent state if setter provided
            if (setVariants && typeof variantIndex === "number") {
                setVariants(prev => {
                    const copy = [...prev];
                    copy[variantIndex] = {
                        ...(copy[variantIndex] || {}),
                        images: [...((copy[variantIndex]?.images) || []), res],
                    };
                    return copy;
                });
            }

            // clear file
            setFile(null);
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.detail || err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    // preview URL for selected file
    const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    const clearDrag = () => setIsDragOver(false);

    const setImageBusy = (id: number, v: boolean) => setBusyImageIds(prev => ({...prev, [id]: v}));

    const updateImageInState = (updated: AdminProductImage) => {
        if (!setVariants || typeof variantIndex !== "number") return;
        setVariants(prev => {
            const copy = [...prev];
            const images: AdminProductImage[] = [...(copy[variantIndex]?.images || [])];
            const idx = images.findIndex(i => i.id === updated.id);
            let next = images;
            if (idx >= 0) {
                next = [...images];
                next[idx] = updated;
            }
            // If this updated image is primary, unset primary from others locally too
            if (updated.is_primary) {
                next = next.map(i => i.id === updated.id ? updated : ({...i, is_primary: false}));
            }
            copy[variantIndex] = {
                ...(copy[variantIndex] || {}),
                images: next,
            };
            return copy;
        });
    };

    const removeImageFromState = (imageId: number) => {
        if (!setVariants || typeof variantIndex !== "number") return;
        setVariants(prev => {
            const copy = [...prev];
            const images: AdminProductImage[] = [...(copy[variantIndex]?.images || [])];
            const next = images.filter(i => i.id !== imageId);
            copy[variantIndex] = {
                ...(copy[variantIndex] || {}),
                images: next,
            };
            return copy;
        });
    };

    const onEditChange = (id: number, key: "alt_text" | "display_order" | "is_active", value: any) => {
        setEditState(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || {}),
                [key]: value,
            },
        }));
    };

    const saveMetadata = async (img: AdminProductImage) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Unauthorized. Please log in.");
            return;
        }
        const changes = editState[img.id] || {};
        if (!("alt_text" in changes) && !("display_order" in changes) && !("is_active" in changes)) return;
        try {
            setImageBusy(img.id, true);
            const updated = await updateProductImageMetadata(token, img.id, {
                alt_text: changes.alt_text ?? undefined,
                display_order: (changes.display_order as number | null | undefined) ?? undefined,
                is_active: changes.is_active ?? undefined,
            });
            updateImageInState(updated);
        } catch (e: any) {
            setError(e?.response?.data?.detail || e.message || "Failed to update metadata");
        } finally {
            setImageBusy(img.id, false);
        }
    };

    const makePrimary = async (img: AdminProductImage) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Unauthorized. Please log in.");
            return;
        }
        try {
            setImageBusy(img.id, true);
            const updated = await updateProductImageMetadata(token, img.id, {is_primary: true});
            // Backend unsets others; locally unset others too
            updateImageInState(updated);
        } catch (e: any) {
            setError(e?.response?.data?.detail || e.message || "Failed to set primary");
        } finally {
            setImageBusy(img.id, false);
        }
    };

    const toggleActive = async (img: AdminProductImage) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Unauthorized. Please log in.");
            return;
        }
        try {
            setImageBusy(img.id, true);
            const updated = await updateProductImageMetadata(token, img.id, {is_active: !img.is_active});
            updateImageInState(updated);
        } catch (e: any) {
            setError(e?.response?.data?.detail || e.message || "Failed to toggle active");
        } finally {
            setImageBusy(img.id, false);
        }
    };

    const onReplaceFilePicked = (id: number, f: File | null) => setReplaceFiles(prev => ({...prev, [id]: f}));

    const replaceFile = async (img: AdminProductImage) => {
        const token = localStorage.getItem("token");
        const f = replaceFiles[img.id];
        if (!token) {
            setError("Unauthorized. Please log in.");
            return;
        }
        if (!f) return;
        try {
            setImageBusy(img.id, true);
            const updated = await replaceProductImageFile(token, img.id, f);
            updateImageInState(updated);
            onReplaceFilePicked(img.id, null);
        } catch (e: any) {
            setError(e?.response?.data?.detail || e.message || "Failed to replace file");
        } finally {
            setImageBusy(img.id, false);
        }
    };

    const removeImage = async (img: AdminProductImage) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Unauthorized. Please log in.");
            return;
        }
        try {
            setImageBusy(img.id, true);
            await deleteProductImage(token, img.id);
            removeImageFromState(img.id);
        } catch (e: any) {
            setError(e?.response?.data?.detail || e.message || "Failed to delete image");
        } finally {
            setImageBusy(img.id, false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Images</Label>
                {!!(variant?.images?.length) && (
                    <span className="text-xs text-gray-500">{variant.images.length} uploaded</span>
                )}
            </div>

            {/* existing images */}
            <div className="flex gap-3 overflow-x-auto pb-1">
                {(variant?.images || []).map((img: AdminProductImage, idx: number) => (
                    <div key={img.id ?? idx} className="flex flex-col items-stretch text-xs min-w-[12rem]">
                        <div className={`relative rounded-md overflow-hidden ring-1 ${img.is_primary ? "ring-blue-500" : "ring-gray-200 dark:ring-gray-700"}`}>
                            <img src={buildMediaUrl(img.image_url)} alt={img.alt_text || "img"}
                                 className="w-48 h-32 object-cover"/>
                            {img.is_primary && (
                                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Primary</span>
                            )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1 items-center">
                            <input
                                className="col-span-2 rounded border px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                                placeholder="Alt text"
                                defaultValue={img.alt_text || ""}
                                onChange={(e) => onEditChange(img.id, "alt_text", e.target.value)}
                                disabled={disabled || busyImageIds[img.id]}
                            />
                            <input
                                className="rounded border px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                                placeholder="Order"
                                type="number"
                                defaultValue={img.display_order}
                                onChange={(e) => onEditChange(img.id, "display_order", Number(e.target.value))}
                                disabled={disabled || busyImageIds[img.id]}
                            />
                            <label className="inline-flex items-center gap-1 text-[11px]">
                                <input
                                    type="checkbox"
                                    defaultChecked={img.is_active}
                                    onChange={(e) => onEditChange(img.id, "is_active", e.target.checked)}
                                    disabled={disabled || busyImageIds[img.id]}
                                />
                                Active
                            </label>
                            <div className="col-span-2 flex gap-2 mt-1">
                                <button type="button"
                                        onClick={() => saveMetadata(img)}
                                        disabled={disabled || busyImageIds[img.id]}
                                        className="px-2 py-1 rounded border bg-white dark:bg-gray-800 text-[11px] border-gray-300 dark:border-gray-700 hover:bg-gray-50">
                                    Save
                                </button>
                                <button type="button"
                                        onClick={() => makePrimary(img)}
                                        disabled={disabled || busyImageIds[img.id] || img.is_primary}
                                        className="px-2 py-1 rounded border bg-white dark:bg-gray-800 text-[11px] border-gray-300 dark:border-gray-700 hover:bg-gray-50">
                                    Make Primary
                                </button>
                                <button type="button"
                                        onClick={() => toggleActive(img)}
                                        disabled={disabled || busyImageIds[img.id]}
                                        className="px-2 py-1 rounded border bg-white dark:bg-gray-800 text-[11px] border-gray-300 dark:border-gray-700 hover:bg-gray-50">
                                    {img.is_active ? "Deactivate" : "Activate"}
                                </button>
                                <button type="button"
                                        onClick={() => removeImage(img)}
                                        disabled={disabled || busyImageIds[img.id]}
                                        className="px-2 py-1 rounded border border-red-300 bg-red-50 text-red-700 text-[11px] hover:bg-red-100">
                                    Delete
                                </button>
                            </div>
                            <div className="col-span-2 flex items-center gap-2 mt-1">
                                <input type="file"
                                       accept="image/*"
                                       onChange={(e) => onReplaceFilePicked(img.id, e.target.files?.[0] ?? null)}
                                       disabled={disabled || busyImageIds[img.id]}
                                       className="text-[11px]"
                                />
                                <button type="button"
                                        onClick={() => replaceFile(img)}
                                        disabled={disabled || busyImageIds[img.id] || !replaceFiles[img.id]}
                                        className="px-2 py-1 rounded border bg-white dark:bg-gray-800 text-[11px] border-gray-300 dark:border-gray-700 hover:bg-gray-50">
                                    Replace
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {(!variant?.images || variant.images.length === 0) && (
                    <div className="text-sm text-gray-500">No images uploaded yet</div>
                )}
            </div>

            {/* upload control */}
            <div className="space-y-2">
                <div
                    className={`relative flex flex-col items-center justify-center text-center rounded-md border-2 border-dashed px-4 py-6 transition ${
                        isDragOver ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30" : "border-gray-300 dark:border-gray-700"
                    } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-blue-400"}`}
                    onClick={() => !disabled && inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!disabled) setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        clearDrag();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (disabled) return;
                        clearDrag();
                        const dropped = e.dataTransfer.files?.[0];
                        if (dropped) {
                            setError(null);
                            setFile(dropped);
                        }
                    }}
                >
                    {/* icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-400 mb-2">
                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zm3 0a.75.75 0 00-.75.75v10.5c0 .414.336.75.75.75h15a.75.75 0 00.75-.75V6.75a.75.75 0 00-.75-.75H4.5zm3.75 3a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM6 18l3.879-3.879a3 3 0 014.242 0L18 18H6z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-200">Drag and drop</span>
                        <span className="text-gray-500"> image here, or </span>
                        <span className="text-blue-600">browse</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</div>

                    {previewUrl && (
                        <div className="mt-3 flex items-center gap-3">
                            <img src={previewUrl} className="w-16 h-16 object-cover rounded-md ring-1 ring-gray-200 dark:ring-gray-700" alt="preview"/>
                            <div className="text-left">
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate max-w-[12rem]">
                                    {file?.name}
                                </div>
                                {file && (
                                    <div className="text-[11px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                )}
                            </div>
                        </div>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        disabled={disabled || uploading}
                        onChange={onFileChange}
                        className="hidden"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled || uploading}
                        className="px-3 py-1.5 rounded border text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        Choose File
                    </button>
                    <button
                        type="button"
                        onClick={upload}
                        disabled={disabled || uploading || !file}
                        className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                    {file && !uploading && (
                        <span className="text-xs text-gray-500">Ready to upload: {file.name}</span>
                    )}
                </div>
                {!hasId && (
                    <div className="text-xs text-amber-600">Save the product/variant before uploading images.</div>
                )}
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
    );
}

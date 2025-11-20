// src/components/products/VariantImageEditor.tsx
import React, {useMemo, useRef, useState} from "react";
import Label from "../../../components/form/Label";
import {AdminProductImage, AdminProductVariant} from "../../../services/productService";
import axios from "axios";

interface Props {
    variant: AdminProductVariant | any;
    disabled?: boolean;
    // optional setter: if provided, we will call it to append image response into the variant's images
    setVariants?: (updater: (prev: any[]) => any[]) => void;
    variantIndex?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function VariantImageEditor({variant, disabled = false, setVariants, variantIndex}: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

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

        const fd = new FormData();
        fd.append("file", file);
        // You can append other form fields (alt_text, is_primary, display_order, is_active) if you want:
        // fd.append("alt_text", "...");
        // fd.append("is_primary", "false");

        setUploading(true);
        setError(null);

        try {
            const res = await axios.post<AdminProductImage>(
                `${API_BASE_URL}/admin/products/variants/${variant.id}/images`,
                fd,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // Append newly created image into the variant in parent state if setter provided
            if (setVariants && typeof variantIndex === "number") {
                setVariants(prev => {
                    const copy = [...prev];
                    copy[variantIndex] = {
                        ...(copy[variantIndex] || {}),
                        images: [...((copy[variantIndex]?.images) || []), res.data],
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
                    <div key={idx} className="flex flex-col items-center text-xs">
                        <div className={`relative rounded-md overflow-hidden ring-1 ${img.is_primary ? "ring-blue-500" : "ring-gray-200 dark:ring-gray-700"}`}>
                            <img src={img.image_url} alt={img.alt_text || "img"}
                                 className="w-20 h-20 object-cover"/>
                            {img.is_primary && (
                                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Primary</span>
                            )}
                        </div>
                        {img.alt_text && <span className="mt-1 text-gray-500 truncate max-w-[5rem]" title={img.alt_text}>{img.alt_text}</span>}
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

// src/services/productService.ts

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_URL = `${API_BASE_URL}/admin/products`;

// -----------------------------------------------------
// 🔹 HELPERS
// -----------------------------------------------------
const getAuthHeaders = (token: string) => ({
    headers: {Authorization: `Bearer ${token}`},
});

// -----------------------------------------------------
// 🔹 ADMIN SCHEMA TYPES
// -----------------------------------------------------

// Prices
export interface AdminProductPrice {
    id: number;
    currency: string;
    price: number;
    is_active: boolean;
}

// Images
export interface AdminProductImage {
    id: number;
    image_url: string;
    alt_text?: string;
    display_order: number;
    is_primary: boolean;
    is_active: boolean;
}

// Attributes
export interface AdminProductAttribute {
    id: number;
    name: string;
    value: string;
    is_active: boolean;
}

// Variants
export interface AdminProductVariant {
    id: number;
    sku: string;
    slug?: string;
    name?: string;
    stock_quantity: number;
    is_default: boolean;
    is_active: boolean;

    weight?: number;
    length?: number;
    width?: number;
    height?: number;

    prices: AdminProductPrice[];
    images: AdminProductImage[];
    attributes: AdminProductAttribute[];
}

// List Item Schema
export interface AdminProductListItem {
    id: number;
    name: string;
    description?: string;
    category: string;
    slug: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    variants_count: number;
}

// Detail Schema
export interface AdminProductDetail {
    id: number;
    name: string;
    description?: string;
    category: string;
    slug: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    variants: AdminProductVariant[];
}

// -----------------------------------------------------
// 🔹 CREATE / UPDATE PAYLOAD TYPES
// -----------------------------------------------------

export interface ProductPricePayload {
    currency: string;
    price: number;
    is_active: boolean;
}

export interface ProductAttributePayload {
    name: string;
    value: string;
    is_active: boolean;
}

export interface ProductImagePayload {
    image_url: string;
    alt_text?: string;
    display_order?: number;
    is_primary: boolean;
    is_active: boolean;
}

export interface CreateProductVariantPayload {
    sku: string;
    slug?: string;
    name?: string;
    stock_quantity?: number;
    is_default: boolean;
    is_active: boolean;

    weight?: number;
    length?: number;
    width?: number;
    height?: number;

    prices: ProductPricePayload[];
    images: ProductImagePayload[];
    attributes: ProductAttributePayload[];
}

export interface UpdateProductVariantPayload
    extends Partial<CreateProductVariantPayload> {
    id?: number;
}

export interface CreateProductPayload {
    name: string;
    description?: string;
    category: string;
    slug: string;
    variants: CreateProductVariantPayload[];
}

export interface UpdateProductPayload {
    name?: string;
    description?: string;
    category?: string;
    slug?: string;
    is_active?: boolean;
    variants?: UpdateProductVariantPayload[];
}

export interface ProductMetrics {
    total_products: number;
    active_products: number;
    total_variants: number;
    low_stock: number;
}

// -----------------------------------------------------
// 🔹 API FUNCTIONS
// -----------------------------------------------------

/**
 * 🟢 Create product
 */
export const createProduct = async (
    token: string,
    payload: CreateProductPayload
): Promise<AdminProductDetail> => {
    const res = await axios.post<AdminProductDetail>(
        `${PRODUCTS_URL}/`,
        payload,
        getAuthHeaders(token)
    );
    return res.data;
};

/**
 * 📄 Get product list
 */
export const listProducts = async (
    token: string,
    params?: {
        search?: string;
        category?: string;
        is_active?: boolean;
        skip?: number;
        limit?: number;
    }
): Promise<AdminProductListItem[]> => {
    const res = await axios.get<AdminProductListItem[]>(`${PRODUCTS_URL}/`, {
        ...getAuthHeaders(token),
        params,
    });
    return res.data;
};

/**
 * 🔍 Get product by ID
 */
export const getProduct = async (
    token: string,
    productId: number
): Promise<AdminProductDetail> => {
    const res = await axios.get<AdminProductDetail>(
        `${PRODUCTS_URL}/${productId}`,
        getAuthHeaders(token)
    );
    return res.data;
};

/**
 * ✏️ Update product
 */
export const updateProduct = async (
    token: string,
    productId: number,
    payload: UpdateProductPayload
): Promise<AdminProductDetail> => {
    const res = await axios.put<AdminProductDetail>(
        `${PRODUCTS_URL}/${productId}`,
        payload,
        getAuthHeaders(token)
    );
    return res.data;
};

/**
 * ❌ Delete product
 */
export const deleteProduct = async (
    token: string,
    productId: number
): Promise<void> => {
    await axios.delete(`${PRODUCTS_URL}/${productId}`, getAuthHeaders(token));
};

/**
 * 📊 Get metrics
 */
export const getProductMetrics = async (
    token: string
): Promise<ProductMetrics> => {
    const res = await axios.get<ProductMetrics>(
        `${PRODUCTS_URL}/metrics/`,
        getAuthHeaders(token)
    );
    return res.data;
};

// -----------------------------------------------------
// 🔹 Upload Variant Image (NEW) — multipart/form-data
// -----------------------------------------------------

export type UploadVariantImageResponse = AdminProductImage;

export const uploadVariantImage = async (
    token: string,
    variantId: number,
    file: File,
    options?: {
        alt_text?: string;
        display_order?: number;
        is_primary?: boolean;
        is_active?: boolean;
    }
): Promise<UploadVariantImageResponse> => {
    const form = new FormData();
    form.append("file", file);

    if (options?.alt_text) form.append("alt_text", options.alt_text);
    form.append("display_order", String(options?.display_order ?? 0));
    form.append("is_primary", String(options?.is_primary ?? false));
    form.append("is_active", String(options?.is_active ?? true));

    const res = await axios.post<UploadVariantImageResponse>(
        `${PRODUCTS_URL}/variants/${variantId}/images`,
        form,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return res.data;
};

// -----------------------------------------------------
// 🔹 Image Management Endpoints (align with admin/product.py)
// -----------------------------------------------------

export interface UpdateImageMetadataOptions {
    alt_text?: string | null;
    display_order?: number | null;
    is_primary?: boolean | null;
    is_active?: boolean | null;
}

/**
 * ✏️ Update image metadata (alt_text, display_order, is_primary, is_active)
 * PUT /admin/products/images/{image_id}
 * FastAPI expects form fields; we send multipart/form-data.
 */
export const updateProductImageMetadata = async (
    token: string,
    imageId: number,
    options: UpdateImageMetadataOptions
): Promise<AdminProductImage> => {
    const form = new FormData();

    // Append only provided fields (including empty string or 0)
    if (options.alt_text !== undefined) {
        // allow clearing alt text by passing empty string or null
        form.append("alt_text", options.alt_text ?? "");
    }
    if (options.display_order !== undefined) {
        form.append("display_order", String(options.display_order));
    }
    if (options.is_primary !== undefined) {
        form.append("is_primary", options.is_primary ? "true" : "false");
    }
    if (options.is_active !== undefined) {
        form.append("is_active", options.is_active ? "true" : "false");
    }

    const res = await axios.put<AdminProductImage>(
        `${PRODUCTS_URL}/images/${imageId}`,
        form,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return res.data;
};

/**
 * 🖼️ Replace image file while keeping metadata
 * PUT /admin/products/images/{image_id}/file
 */
export const replaceProductImageFile = async (
    token: string,
    imageId: number,
    file: File
): Promise<AdminProductImage> => {
    const form = new FormData();
    form.append("file", file);

    const res = await axios.put<AdminProductImage>(
        `${PRODUCTS_URL}/images/${imageId}/file`,
        form,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return res.data;
};

export interface DeleteImageResponse { message: string }

/**
 * 🗑️ Delete image (DB + filesystem)
 * DELETE /admin/products/images/{image_id}
 */
export const deleteProductImage = async (
    token: string,
    imageId: number
): Promise<DeleteImageResponse> => {
    const res = await axios.delete<DeleteImageResponse>(
        `${PRODUCTS_URL}/images/${imageId}`,
        getAuthHeaders(token)
    );
    return res.data;
};

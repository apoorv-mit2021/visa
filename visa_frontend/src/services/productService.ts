// src/services/productService.ts

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_URL = `${API_BASE_URL}/admin/products`;

// ----------------------------------------------
// Helpers
// ----------------------------------------------
const getAuthHeaders = (token: string) => ({
    headers: {Authorization: `Bearer ${token}`},
});

// Transform sizes array used in UI to the dictionary expected by backend
const toSizesDict = (sizes: ProductSize[] | undefined) => {
    if (!sizes) return undefined as unknown as Record<string, number> | undefined;
    return sizes.reduce<Record<string, number>>((acc, item) => {
        if (item.size) acc[item.size] = item.stock ?? 0;
        return acc;
    }, {});
};

// ----------------------------------------------
// TYPES (Match backend schemas)
// ----------------------------------------------

export interface ProductSize {
    size: string;
    stock: number;
}

export interface ProductBase {
    sku: string;
    name: string;
    description?: string;
    rating?: number;
    price: number;
    currency: string;
    category: string;

    sizes: ProductSize[];
    care_instructions: string[];
    product_details: Record<string, string>;
    images: string[];
}

export interface Product extends ProductBase {
    id: number;
    slug: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type ProductCreatePayload = ProductBase

export interface ProductUpdatePayload {
    sku?: string;
    name?: string;
    description?: string;
    rating?: number;
    price?: number;
    currency?: string;
    category?: string;

    sizes?: ProductSize[];
    care_instructions?: string[];
    product_details?: Record<string, string>;
    images?: string[];

    is_active?: boolean;
}

export interface ProductMetrics {
    total_products: number;
    active_products: number;
    inactive_products: number;
    low_stock_products: number;
}

// ----------------------------------------------
// Catalog constants (keep in sync with backend)
// ----------------------------------------------
export const CURRENCIES = ["USD", "EUR", "CAD"] as const;
export const DEFAULT_CURRENCY = "CAD" as (typeof CURRENCIES)[number];

export type Currency = (typeof CURRENCIES)[number];

export interface ProductCategoryOption {
    value: string;
    label: string;
}

// ----------------------------------------------
// API FUNCTIONS
// ----------------------------------------------

/** Create product */
export const createProduct = async (
    token: string,
    payload: ProductCreatePayload
): Promise<Product> => {
    // Backend expects sizes as Dict[str, int]
    const transformed = {
        ...payload,
        sizes: toSizesDict(payload.sizes) as unknown as Record<string, number>,
    } as unknown as ProductCreatePayload;
    const res = await axios.post<Product>(`${PRODUCTS_URL}/`, transformed, getAuthHeaders(token));
    return res.data;
};

/** List products */
export const listProducts = async (
    token: string,
    params?: {
        search?: string;
        category?: string;
        collection_id?: number;
        skip?: number;
        limit?: number;
    }
): Promise<Product[]> => {
    const res = await axios.get<Product[]>(`${PRODUCTS_URL}/`, {
        ...getAuthHeaders(token),
        params,
    });
    return res.data;
};

/** Get a single product */
export const getProduct = async (
    token: string,
    productId: number
): Promise<Product> => {
    const res = await axios.get<Product>(`${PRODUCTS_URL}/${productId}`, getAuthHeaders(token));
    return res.data;
};

/** Update product */
export const updateProduct = async (
    token: string,
    productId: number,
    payload: ProductUpdatePayload
): Promise<Product> => {
    // Transform sizes only if provided
    const transformed = (
        payload && typeof payload === "object"
            ? {
                  ...payload,
                  ...(payload.sizes !== undefined
                      ? { sizes: toSizesDict(payload.sizes) as unknown as Record<string, number> }
                      : {}),
              }
            : payload
    ) as ProductUpdatePayload;
    const res = await axios.put<Product>(`${PRODUCTS_URL}/${productId}`, transformed, getAuthHeaders(token));
    return res.data;
};

/** Delete product */
export const deleteProduct = async (token: string, productId: number): Promise<void> => {
    await axios.delete(`${PRODUCTS_URL}/${productId}`, getAuthHeaders(token));
};

/** Product Metrics */
export const getProductMetrics = async (
    token: string
): Promise<ProductMetrics> => {
    const res = await axios.get<ProductMetrics>(`${PRODUCTS_URL}/metrics/`, getAuthHeaders(token));
    return res.data;
};

/** Product Categories (for dropdowns) */
export const getProductCategories = async (
    token: string
): Promise<ProductCategoryOption[]> => {
    const res = await axios.get<ProductCategoryOption[]>(`${PRODUCTS_URL}/categories/`, getAuthHeaders(token));
    return res.data;
};

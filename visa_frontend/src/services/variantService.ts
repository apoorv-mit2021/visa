// src/services/variantService.ts

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper to attach Authorization header from stored token
const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return { headers: { Authorization: `Bearer ${token}` } };
};

// -----------------------------
// Types
// -----------------------------

export interface ProductPrice {
    id?: number;
    currency: string;
    price: number;
    created_at?: string;
    updated_at?: string;
}

export interface ProductImage {
    id?: number;
    image_url: string;
    alt_text?: string | null;
    display_order?: number;
    is_primary?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProductAttribute {
    id?: number;
    name: string;
    value: string;
    created_at?: string;
    updated_at?: string;
}

export interface ProductVariant {
    id: number;
    sku: string;
    name?: string | null;
    stock_quantity: number;
    is_default: boolean;
    created_at: string;
    updated_at?: string;
    prices?: ProductPrice[];
    images?: ProductImage[];
    attributes?: ProductAttribute[];
}

// -----------------------------
// Create / Update DTOs
// -----------------------------

export interface ProductVariantCreate {
    sku: string;
    name?: string;
    stock_quantity?: number;
    is_default?: boolean;
}

export interface ProductVariantUpdate {
    sku?: string;
    name?: string;
    stock_quantity?: number;
    is_default?: boolean;
}

// -----------------------------
// Service Methods
// -----------------------------

// ✅ Create Variant
export const createVariant = async (productId: number, data: ProductVariantCreate): Promise<ProductVariant> => {
    const res = await axios.post(`${API_BASE_URL}/admin/variants?product_id=${productId}`, data, getAuthHeaders());
    return res.data;
};

// ✅ Get All Variants (optionally by product)
export const getVariants = async (params?: {
    product_id?: number;
    is_default?: boolean;
    skip?: number;
    limit?: number;
}): Promise<ProductVariant[]> => {
    const res = await axios.get(`${API_BASE_URL}/admin/variants`, {
        ...getAuthHeaders(),
        params,
    });
    return res.data;
};

// ✅ Get Single Variant
export const getVariantById = async (variantId: number): Promise<ProductVariant> => {
    const res = await axios.get(`${API_BASE_URL}/admin/variants/${variantId}`, getAuthHeaders());
    return res.data;
};

// ✅ Update Variant
export const updateVariant = async (variantId: number, data: ProductVariantUpdate): Promise<ProductVariant> => {
    const res = await axios.put(`${API_BASE_URL}/admin/variants/${variantId}`, data, getAuthHeaders());
    return res.data;
};

// ✅ Delete Variant
export const deleteVariant = async (variantId: number): Promise<{ message: string }> => {
    const res = await axios.delete(`${API_BASE_URL}/admin/variants/${variantId}`, getAuthHeaders());
    return res.data;
};

// ✅ Update Stock
export const updateVariantStock = async (
    variantId: number,
    stock_quantity: number
): Promise<{ message: string; new_stock: number }> => {
    const res = await axios.patch(
        `${API_BASE_URL}/admin/variants/${variantId}/stock`,
        null,
        { ...getAuthHeaders(), params: { stock_quantity } }
    );
    return res.data;
};

// ✅ Add or Update Price
export const addOrUpdatePrice = async (
    variantId: number,
    currency: string,
    price: number
): Promise<{ message: string; currency: string; price: number }> => {
    const res = await axios.post(
        `${API_BASE_URL}/admin/variants/${variantId}/prices`,
        null,
        { ...getAuthHeaders(), params: { currency, price } }
    );
    return res.data;
};

// ✅ Update Existing Price
export const updatePrice = async (
    variantId: number,
    priceId: number,
    price: number
): Promise<{ message: string; new_price: number }> => {
    const res = await axios.patch(
        `${API_BASE_URL}/admin/variants/${variantId}/prices/${priceId}`,
        null,
        { ...getAuthHeaders(), params: { price } }
    );
    return res.data;
};

// ✅ Delete Price
export const deletePrice = async (
    variantId: number,
    priceId: number
): Promise<{ message: string }> => {
    const res = await axios.delete(`${API_BASE_URL}/admin/variants/${variantId}/prices/${priceId}`, getAuthHeaders());
    return res.data;
};

// ✅ Add Attribute
export const addAttribute = async (
    variantId: number,
    name: string,
    value: string
): Promise<{ message: string }> => {
    const res = await axios.post(
        `${API_BASE_URL}/admin/variants/${variantId}/attributes`,
        null,
        { ...getAuthHeaders(), params: { name, value } }
    );
    return res.data;
};

// ✅ Update Attribute
export const updateAttribute = async (
    variantId: number,
    attributeId: number,
    value: string
): Promise<{ message: string; new_value: string }> => {
    const res = await axios.patch(
        `${API_BASE_URL}/admin/variants/${variantId}/attributes/${attributeId}`,
        null,
        { ...getAuthHeaders(), params: { value } }
    );
    return res.data;
};

// ✅ Delete Attribute
export const deleteAttribute = async (
    variantId: number,
    attributeId: number
): Promise<{ message: string }> => {
    const res = await axios.delete(`${API_BASE_URL}/admin/variants/${variantId}/attributes/${attributeId}`, getAuthHeaders());
    return res.data;
};

// ✅ Add Image
export const addImage = async (
    variantId: number,
    image_url: string,
    alt_text?: string,
    is_primary?: boolean
): Promise<{ message: string }> => {
    const res = await axios.post(
        `${API_BASE_URL}/admin/variants/${variantId}/images`,
        null,
        { ...getAuthHeaders(), params: { image_url, alt_text, is_primary } }
    );
    return res.data;
};

// ✅ Update Image
export const updateImage = async (
    variantId: number,
    imageId: number,
    data: { image_url?: string; alt_text?: string; is_primary?: boolean }
): Promise<{ message: string }> => {
    const res = await axios.patch(`${API_BASE_URL}/admin/variants/${variantId}/images/${imageId}`, data, getAuthHeaders());
    return res.data;
};

// ✅ Delete Image
export const deleteImage = async (
    variantId: number,
    imageId: number
): Promise<{ message: string }> => {
    const res = await axios.delete(`${API_BASE_URL}/admin/variants/${variantId}/images/${imageId}`, getAuthHeaders());
    return res.data;
};

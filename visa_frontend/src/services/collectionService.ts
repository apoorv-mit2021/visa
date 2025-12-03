// src/services/collectionService.ts

import axios from "axios";

// -----------------------------
// API CONFIG
// -----------------------------
const API_BASE_URL = import.meta.env.VITE_API_URL;
const COLLECTIONS_URL = `${API_BASE_URL}/admin/collections`;

// -----------------------------
// TYPES
// -----------------------------

export interface CollectionBase {
    name: string;
    description?: string;
}

export interface Collection extends CollectionBase {
    id: number;
    slug: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    show_on_landing?: boolean;
    product_ids?: number[];
}

export interface CollectionCreate extends CollectionBase {
    show_on_landing?: boolean;
    product_ids?: number[];
}

export interface CollectionUpdate {
    name?: string;
    description?: string;
    is_active?: boolean;
    show_on_landing?: boolean;
    product_ids?: number[];
}

export interface CollectionMetrics {
    total_collections: number;
    active_collections: number;
    total_linked_products: number;
    avg_products_per_collection: number;
}

// -----------------------------
// SERVICE FUNCTIONS
// -----------------------------

/**
 * 📦 Get all collections (with optional filters)
 */
export async function listCollections(
    token: string,
    params: { skip?: number; limit?: number; is_active?: boolean | null; search?: string } = {}
): Promise<Collection[]> {
    const response = await axios.get(`${COLLECTIONS_URL}/`, {
        headers: {Authorization: `Bearer ${token}`},
        params,
    });
    return response.data;
}

/**
 * 📦 Get a single collection by ID
 */
export async function getCollection(
    token: string,
    id: number
): Promise<Collection> {
    const response = await axios.get(`${COLLECTIONS_URL}/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
    });
    return response.data;
}

/**
 * ➕ Create a new collection
 * Backend auto-generates slug
 */
export async function createCollection(
    token: string,
    data: CollectionCreate
): Promise<Collection> {
    const response = await axios.post(`${COLLECTIONS_URL}/`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    return response.data;
}

/**
 * ✏️ Update an existing collection
 * Automatically updates slug if name changes (handled by backend)
 */
export async function updateCollection(
    token: string,
    id: number,
    data: CollectionUpdate
): Promise<Collection> {
    const response = await axios.put(`${COLLECTIONS_URL}/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    return response.data;
}

/**
 * ❌ Delete a collection
 */
export async function deleteCollection(token: string, id: number): Promise<void> {
    await axios.delete(`${COLLECTIONS_URL}/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
    });
}

/**
 * 🔗 Link specific products to a collection
 */
export async function linkProductsToCollection(
    token: string,
    collectionId: number,
    productIds: number[]
): Promise<Collection> {
    const response = await axios.put(
        `${COLLECTIONS_URL}/${collectionId}`,
        {product_ids: productIds},
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
}

/**
 * 🧹 Unlink all products from a collection
 */
export async function clearCollectionProducts(
    token: string,
    collectionId: number
): Promise<Collection> {
    const response = await axios.put(
        `${COLLECTIONS_URL}/${collectionId}`,
        {product_ids: []},
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
}

/**
 * 📊 Get Collection Metrics
 */
export async function getCollectionMetrics(token: string): Promise<CollectionMetrics> {
    const response = await axios.get(`${COLLECTIONS_URL}/metrics/`, {
        headers: {Authorization: `Bearer ${token}`},
    });
    return response.data;
}
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const INVENTORY_URL = `${API_BASE_URL}/admin/inventory`;

// ---------------------------------------------
// TYPES
// ---------------------------------------------

export interface InventoryMovement {
    id: number;
    product_id: number;
    previous_quantity: number;
    change: number;
    new_quantity: number;
    reason: string;
    note?: string | null;
    performed_by_id?: number | null;
    created_at: string;
}

export interface InventoryMetrics {
    total_products: number;
    total_stock: number;
    low_stock_items: number;
    out_of_stock_items: number;
}

export interface LowStockProduct {
    id: number;
    name: string;
    sku: string;
    category: string | null;
    low_sizes: Record<string, number>;
    total_stock: number;
}

// ---------------------------------------------
// HELPERS
// ---------------------------------------------
const getAuthHeaders = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// ---------------------------------------------
// SERVICE METHODS
// ---------------------------------------------

/**
 * 1️⃣ Get inventory metrics
 */
export const getInventoryMetrics = async (
    token: string
): Promise<InventoryMetrics> => {
    const {data} = await axios.get<InventoryMetrics>(
        `${INVENTORY_URL}/metrics/`,
        getAuthHeaders(token)
    );
    return data;
};

/**
 * 2️⃣ Get inventory movement logs
 */
export const getInventoryMovements = async (
    token: string,
    params?: { limit?: number; offset?: number }
): Promise<InventoryMovement[]> => {
    const {data} = await axios.get<InventoryMovement[]>(
        `${INVENTORY_URL}/movements/`,
        {
            ...getAuthHeaders(token),
            params,
        }
    );
    return data;
};

/**
 * 3️⃣ Get low-stock products (per-size)
 */
export const getLowStockProducts = async (
    token: string,
    params?: { threshold?: number }
): Promise<LowStockProduct[]> => {
    const {data} = await axios.get<LowStockProduct[]>(
        `${INVENTORY_URL}/low-stock/`,
        {
            ...getAuthHeaders(token),
            params,
        }
    );
    return data;
};

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const INVENTORY_URL = `${API_BASE_URL}/admin/inventory`;

// ---------------------------------------------
// TYPES
// ---------------------------------------------

// Inventory movement log (audit trail)
export interface InventoryMovement {
    id: number;
    variant_id: number;
    previous_quantity: number;
    change: number;
    new_quantity: number;
    reason: string;
    note?: string | null;
    performed_by_id?: number | null;
    created_at: string;
}

// Inventory metrics summary
export interface InventoryMetrics {
    total_products: number;
    total_variants: number;
    total_stock: number;
    low_stock_items: number;
    out_of_stock_items: number;
}

// Low-stock variant summary
export interface LowStockVariant {
    product_id: number;
    product_name: string;
    category: string | null;
    is_active: boolean;
    variant_id: number;
    variant_name: string | null;
    sku: string;
    stock_quantity: number;
    threshold: number;
    is_default: boolean;
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
 * 📊 1. Get inventory metrics
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
 * 📜 2. Get global inventory movement logs (latest first)
 */
export const getInventoryMovements = async (
    token: string,
    params?: { skip?: number; limit?: number }
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
 * 🟠 3. Get low-stock product variants (paginated)
 */
export const getLowStockVariants = async (
    token: string,
    params?: { skip?: number; limit?: number; threshold?: number }
): Promise<LowStockVariant[]> => {
    const {data} = await axios.get<LowStockVariant[]>(
        `${INVENTORY_URL}/low-stock/`,
        {
            ...getAuthHeaders(token),
            params,
        }
    );
    return data;
};

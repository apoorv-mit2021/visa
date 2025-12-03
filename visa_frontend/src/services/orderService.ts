import axios from "axios";

// -----------------------------
// API CONFIG
// -----------------------------
const API_BASE_URL = import.meta.env.VITE_API_URL;
const ORDERS_URL = `${API_BASE_URL}/admin/orders`;

// -----------------------------
// TYPES
// -----------------------------

export interface OrderItem {
    id: number;
    product_id: number;
    size: string;
    quantity: number;
    price: number;
    product?: {
        id: number;
        sku: string;
        name: string;
        description?: string | null;
        price: number;
        currency: string;
        images: string[];
    };
}

export interface Order {
    id: number;
    user_id: number;
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
}

export interface OrderMetrics {
    total_orders: number;
    pending_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    avg_order_value: number;
    orders_last_7_days: number;
}

// -----------------------------
// HELPERS
// -----------------------------
const getAuthHeaders = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
});

// -----------------------------
// SERVICE FUNCTIONS
// -----------------------------

// -----------------------------
// ORDER STATUS CONSTANTS
// -----------------------------

/**
 * Canonical order status values used across the Admin UI.
 * Keep in sync with backend: pending, paid, shipped, delivered, cancelled
 */
export const OrderStatus = {
    PENDING: "pending",
    PAID: "paid",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
} as const;

export type OrderStatusValue = typeof OrderStatus[keyof typeof OrderStatus];

/**
 * Convenience list for dropdowns and selectors in the UI
 */
export const ORDER_STATUS_OPTIONS: OrderStatusValue[] = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
];

/**
 * 📋 Get all orders (Admin)
 */
export async function listOrders(
    token: string,
    params?: { status_filter?: string }
): Promise<Order[]> {
    const {data} = await axios.get<Order[]>(`${ORDERS_URL}/`, {
        ...getAuthHeaders(token),
        params,
    });
    return data;
}

/**
 * 🔍 Get a single order by ID (Admin)
 */
export async function getOrder(
    token: string,
    orderId: number
): Promise<Order> {
    const {data} = await axios.get<Order>(
        `${ORDERS_URL}/${orderId}`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * ✏️ Update an order’s status (Admin)
 *
 * Backend expects:
 * PUT /admin/orders/{order_id}/status?status=shipped
 */
export async function updateOrderStatus(
    token: string,
    orderId: number,
    status: string
): Promise<Order> {
    const {data} = await axios.put<Order>(
        `${ORDERS_URL}/${orderId}/status`,
        null,
        {
            ...getAuthHeaders(token),
            params: {status},
        }
    );
    return data;
}

/**
 * 📊 Order Metrics (Admin)
 */
export async function getOrderMetrics(
    token: string
): Promise<OrderMetrics> {
    const {data} = await axios.get<OrderMetrics>(
        `${ORDERS_URL}/metrics/`,
        getAuthHeaders(token)
    );
    return data;
}

import axios from "axios";

// -----------------------------
// API CONFIG
// -----------------------------
const API_BASE_URL = import.meta.env.VITE_API_URL;
const ORDERS_URL = `${API_BASE_URL}/admin/orders`;

// -----------------------------
// TYPES
// -----------------------------

export interface Order {
    id: number;
    user_id: number;
    status: string;
    total_amount: number;
    created_at: string;
    updated_at: string;
    items?: OrderItem[];
    shipping_address?: string;
    billing_address?: string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
}

export interface OrderMetrics {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
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

/**
 * 📋 Get all orders (Admin/Staff)
 */
export async function listOrders(
    token: string,
    params?: { skip?: number; limit?: number; status?: string }
): Promise<Order[]> {
    const {data} = await axios.get<Order[]>(ORDERS_URL, {
        ...getAuthHeaders(token),
        params,
    });
    return data;
}

/**
 * 🔍 Get a single order by ID
 */
export async function getOrder(token: string, orderId: number): Promise<Order> {
    const {data} = await axios.get<Order>(
        `${ORDERS_URL}/${orderId}`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * ✏️ Update an order’s status
 */
export async function updateOrderStatus(
    token: string,
    orderId: number,
    status: string
): Promise<Order> {
    const {data} = await axios.put<Order>(
        `${ORDERS_URL}/${orderId}/status`,
        null, // backend expects query param
        {
            ...getAuthHeaders(token),
            params: {status},
        }
    );
    return data;
}

/**
 * 📊 Get order metrics (Admin/Staff)
 */
export async function getOrderMetrics(token: string): Promise<OrderMetrics> {
    const {data} = await axios.get<OrderMetrics>(
        `${ORDERS_URL}/metrics/`,
        getAuthHeaders(token)
    );
    console.log(data);
    return data;
}

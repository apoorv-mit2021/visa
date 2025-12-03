import axios from "axios";

// -----------------------------
// API CONFIG
// -----------------------------
const API_BASE_URL = import.meta.env.VITE_API_URL;
const CLIENT_URL = `${API_BASE_URL}/admin/client`;

// -----------------------------
// TYPES (Matches backend)
// -----------------------------

export interface Customer {
    id: number;
    full_name: string;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
    roles: string[];
}

export interface CustomerMetrics {
    total_clients: number;
    verified_clients: number;
    total_orders: number;
    avg_orders_per_client: number;
}

// Admin-only updates for clients (matches backend schema)
export interface CustomerAdminUpdatePayload {
    is_active?: boolean;
    is_verified?: boolean;
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
 * 📋 List customers (clients)
 * Supports pagination, search, and active filter.
 */
export async function listCustomers(
    token: string,
    params: {
        skip?: number;
        limit?: number;
        search?: string;
        is_active?: boolean | null;
    } = {}
): Promise<Customer[]> {
    const response = await axios.get<Customer[]>(CLIENT_URL + "/", {
        ...getAuthHeaders(token),
        params,
    });

    return response.data;
}

/**
 * 🔍 Get a single customer by ID
 */
export async function getCustomer(
    token: string,
    id: number
): Promise<Customer> {
    const response = await axios.get<Customer>(
        `${CLIENT_URL}/${id}`,
        getAuthHeaders(token)
    );
    return response.data;
}

/**
 * 📊 Get customer metrics (admin-only)
 */
export async function getCustomerMetrics(
    token: string
): Promise<CustomerMetrics> {
    const response = await axios.get<CustomerMetrics>(
        `${CLIENT_URL}/metrics/`,
        getAuthHeaders(token)
    );
    return response.data;
}

/**
 * ✏️ Update a customer (admin-only)
 * Backend: PUT /admin/client/{client_id}
 * Only accepts is_active and/or is_verified.
 */
export async function updateCustomerAdmin(
    token: string,
    id: number,
    data: CustomerAdminUpdatePayload
): Promise<Customer> {
    const response = await axios.put<Customer>(
        `${CLIENT_URL}/${id}`,
        // Axios omits undefined keys; backend uses exclude_unset
        data,
        getAuthHeaders(token)
    );
    return response.data;
}

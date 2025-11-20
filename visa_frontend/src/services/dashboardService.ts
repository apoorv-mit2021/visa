import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DASHBOARD_URL = `${API_BASE_URL}/admin/dashboard`;

// -----------------------------
// TYPES
// -----------------------------

export interface DashboardMetrics {
    total_orders: number;
    total_customers: number;
}

export interface MonthlySalesChart {
    labels: string[];
    values: number[];
}

export interface MonthlyTarget {
    target: number;
    current_revenue: number;
    percentage: number;
    today_revenue: number;
    growth_percent: number;
}

export interface Order {
    id: number;
    status: string;
    total_amount: number;
    created_at: string;
    updated_at: string;
    user_id?: number;
}

export interface LowStockItem {
    product_id: number;
    product_name: string;
    variant_id: number;
    variant_name: string | null;
    sku: string;
    stock_quantity: number;
    category: string;
    is_active: boolean;
}

export interface StatisticsChart {
    labels: string[];
    sales: number[];
    revenue: number[];
}

// -----------------------------
// HELPERS
// -----------------------------

const getAuthHeaders = (token: string) => ({
    headers: {Authorization: `Bearer ${token}`},
});

// -----------------------------
// API FUNCTIONS
// -----------------------------

/**
 * 1️⃣ Get total orders & customers
 */
export async function getDashboardMetrics(token: string): Promise<DashboardMetrics> {
    const {data} = await axios.get<DashboardMetrics>(
        `${DASHBOARD_URL}/metrics/`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * 2️⃣ Get monthly sales (for bar chart)
 */
export async function getMonthlySalesChart(token: string): Promise<MonthlySalesChart> {
    const {data} = await axios.get<MonthlySalesChart>(
        `${DASHBOARD_URL}/sales/monthly`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * 3️⃣ Get monthly target (for radial chart)
 */
export async function getMonthlyTarget(token: string): Promise<MonthlyTarget> {
    const {data} = await axios.get<MonthlyTarget>(
        `${DASHBOARD_URL}/target/monthly`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * 4️⃣ Get recent orders (last 5)
 */
export async function getRecentOrders(token: string): Promise<Order[]> {
    const {data} = await axios.get<Order[]>(
        `${DASHBOARD_URL}/orders/recent`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * 5️⃣ Get low-stock products (lowest 5 variants)
 */
export async function getLowStockProducts(token: string): Promise<LowStockItem[]> {
    const {data} = await axios.get<LowStockItem[]>(
        `${DASHBOARD_URL}/products/low-stock`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * 6️⃣ Get sales & revenue statistics (for line chart)
 */
export async function getSalesRevenueStatistics(token: string): Promise<StatisticsChart> {
    const {data} = await axios.get<StatisticsChart>(
        `${DASHBOARD_URL}/statistics`,
        getAuthHeaders(token)
    );
    return data;
}

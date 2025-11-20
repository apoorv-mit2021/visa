import axios from "axios";

// -----------------------------
// API CONFIG
// -----------------------------
const API_BASE_URL = import.meta.env.VITE_API_URL;
const COUPONS_URL = `${API_BASE_URL}/admin/coupons`;

// -----------------------------
// TYPES
// -----------------------------

export type DiscountType = "percentage" | "fixed";

export interface Coupon {
    id: number;
    code: string;
    description?: string;

    discount_type: DiscountType;

    // For "percentage" coupons
    discount_value?: number | null;

    // For "fixed" coupons: always a dict, never null
    fixed_discounts: Record<string, number>;

    min_order_value?: number | null;
    max_discount_amount?: number | null;

    usage_limit?: number | null;
    used_count: number;

    start_date?: string | null;
    end_date?: string | null;

    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Create Coupon Request
export interface CreateCouponRequest {
    code: string;
    description?: string;

    discount_type: DiscountType;

    // For "percentage"
    discount_value?: number | null;

    // For "fixed"
    fixed_discounts?: Record<string, number>;

    min_order_value?: number;
    max_discount_amount?: number;
    usage_limit?: number;

    start_date?: string;
    end_date?: string;

    is_active?: boolean;
}

// Update Coupon Request
export interface UpdateCouponRequest {
    code?: string;
    description?: string;

    discount_type?: DiscountType;

    discount_value?: number | null;

    fixed_discounts?: Record<string, number>;

    min_order_value?: number;
    max_discount_amount?: number;

    usage_limit?: number;

    start_date?: string;
    end_date?: string;

    is_active?: boolean;
}

// Coupon Metrics Response
export interface CouponMetrics {
    total_coupons: number;
    active_coupons: number;
    expired_coupons: number;
    total_redemptions: number;
}

// -----------------------------
// Helper Function
// -----------------------------
const getAuthHeaders = (token: string) => ({
    headers: {Authorization: `Bearer ${token}`},
});

// -----------------------------
// API FUNCTIONS
// -----------------------------

/**
 * 🟢 Create a new coupon
 */
export const createCoupon = async (
    token: string,
    data: CreateCouponRequest
): Promise<Coupon> => {
    // Ensure fixed_discounts is always an object
    if (!data.fixed_discounts) data.fixed_discounts = {};

    const {data: res} = await axios.post<Coupon>(
        COUPONS_URL + "/",
        data,
        getAuthHeaders(token)
    );
    return res;
};

/**
 * 📋 Get all coupons
 */
export const listCoupons = async (
    token: string,
    params?: { skip?: number; limit?: number; is_active?: boolean }
): Promise<Coupon[]> => {
    const {data} = await axios.get<Coupon[]>(COUPONS_URL + "/", {
        ...getAuthHeaders(token),
        params,
    });
    return data;
};

/**
 * 🔍 Get a single coupon by ID
 */
export const getCoupon = async (
    token: string,
    couponId: number
): Promise<Coupon> => {
    const {data} = await axios.get<Coupon>(
        `${COUPONS_URL}/${couponId}`,
        getAuthHeaders(token)
    );
    return data;
};

/**
 * ✏️ Update a coupon
 */
export const updateCoupon = async (
    token: string,
    couponId: number,
    data: UpdateCouponRequest
): Promise<Coupon> => {
    // Ensure fixed_discounts is always an object when present
    if (data.fixed_discounts === undefined) {
        // Do nothing — leave undefined to avoid overwriting
    } else if (data.fixed_discounts === null) {
        // Backend does NOT allow null → convert to {}
        data.fixed_discounts = {};
    }

    const {data: res} = await axios.put<Coupon>(
        `${COUPONS_URL}/${couponId}`,
        data,
        getAuthHeaders(token)
    );
    return res;
};

/**
 * ❌ Delete a coupon
 */
export const deleteCoupon = async (
    token: string,
    couponId: number
): Promise<void> => {
    await axios.delete(`${COUPONS_URL}/${couponId}`, getAuthHeaders(token));
};

/**
 * 📊 Get coupon metrics (Admin only)
 */
export const getCouponMetrics = async (
    token: string
): Promise<CouponMetrics> => {
    const {data} = await axios.get<CouponMetrics>(
        `${COUPONS_URL}/metrics/`,
        getAuthHeaders(token)
    );
    return data;
};

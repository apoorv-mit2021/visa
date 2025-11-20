// src/services/employeeService.ts

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const EMPLOYEE_URL = `${API_BASE_URL}/admin/staff`;

// -----------------------------------------------------
// TYPES (Matches Backend Exactly)
// -----------------------------------------------------

export interface Staff {
    id: number;
    full_name: string;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
    roles: string[];
}

// Create
export interface CreateStaffRequest {
    full_name: string;
    email: string;
    password: string;
}

// Update
export interface UpdateStaffRequest {
    full_name?: string;
    email?: string;
    password?: string;
    is_active?: boolean;
}

// Metrics
export interface StaffMetrics {
    total_staff: number;
    active_staff: number;
    open_cases: number;
    avg_case_load_per_staff: number;
}

// -----------------------------------------------------
// HELPERS
// -----------------------------------------------------
const auth = (token: string) => ({
    headers: {Authorization: `Bearer ${token}`},
});

// -----------------------------------------------------
// API FUNCTIONS
// -----------------------------------------------------

/**
 * 🧑‍💼 List all staff members
 */
export const listStaff = async (
    token: string,
    params?: { search?: string; skip?: number; limit?: number }
): Promise<Staff[]> => {
    const res = await axios.get<Staff[]>(`${EMPLOYEE_URL}/`, {
        ...auth(token),
        params,
    });
    return res.data;
};

/**
 * 🔍 Get single staff member
 */
export const getStaff = async (
    token: string,
    staffId: number
): Promise<Staff> => {
    const res = await axios.get<Staff>(
        `${EMPLOYEE_URL}/${staffId}`,
        auth(token)
    );
    return res.data;
};

/**
 * ➕ Create new staff member
 */
export const createStaff = async (
    token: string,
    payload: CreateStaffRequest
): Promise<Staff> => {
    const res = await axios.post<Staff>(
        `${EMPLOYEE_URL}/`,
        payload,
        auth(token)
    );
    return res.data;
};

/**
 * ✏️ Update staff member
 */
export const updateStaff = async (
    token: string,
    staffId: number,
    payload: UpdateStaffRequest
): Promise<Staff> => {
    const res = await axios.put<Staff>(
        `${EMPLOYEE_URL}/${staffId}`,
        payload,
        auth(token)
    );
    return res.data;
};

/**
 * 🚫 Deactivate staff member
 */
export const deactivateStaff = async (
    token: string,
    staffId: number
): Promise<{ message: string }> => {
    const res = await axios.delete<{ message: string }>(
        `${EMPLOYEE_URL}/${staffId}`,
        auth(token)
    );
    return res.data;
};

/**
 * 📊 Staff Metrics
 */
export const getStaffMetrics = async (
    token: string
): Promise<StaffMetrics> => {
    const res = await axios.get<StaffMetrics>(
        `${EMPLOYEE_URL}/metrics/`,
        auth(token)
    );
    return res.data;
};

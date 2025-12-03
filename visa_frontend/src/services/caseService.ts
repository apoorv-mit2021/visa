import axios from "axios";

// -----------------------------
// API CONFIG
// -----------------------------
const API_BASE_URL = import.meta.env.VITE_API_URL;
const SUPPORT_URL = `${API_BASE_URL}/admin/support`;

// -----------------------------
// TYPES (ACCURATE TO BACKEND)
// -----------------------------

export interface CaseMessage {
    id: number;
    sender_id: number;
    message: string;
    created_at: string;
}

export interface CaseMessageCreate {
    message: string;
}

export interface SupportCase {
    id: number;
    user_id: number;
    order_id?: number | null;
    assigned_to_id?: number | null;

    subject: string;
    description?: string | null;
    status: string;

    created_at: string;
    updated_at: string;

    messages: CaseMessage[];
}

export interface SupportCaseUpdate {
    status?: string;
    assigned_to_id?: number | null;
}

export interface SupportCaseCreate {
    user_id: number;
    subject: string;
    description?: string | null;
    order_id?: number | null;
    assigned_to_id?: number | null;
    status?: string; // defaults to "open" on backend typically
}

export interface SupportMetrics {
    total_cases: number;
    open_cases: number;
    closed_cases: number;
    in_progress_cases: number;      // if you decide to add it
    cases_last_7_days: number;
    avg_response_time_hours: number;
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
 * 📋 List support cases (Admin/Staff)
 * Backend supports: ?status=&search=&skip=&limit=
 */
export async function listSupportCases(
    token: string,
    params?: {
        status?: string;
        search?: string;
        skip?: number;
        limit?: number;
    }
): Promise<SupportCase[]> {
    const {data} = await axios.get<SupportCase[]>(
        `${SUPPORT_URL}/`,
        {
            ...getAuthHeaders(token),
            params,
        }
    );
    return data;
}

/**
 * 🔍 Get a single support case by ID
 */
export async function getSupportCase(
    token: string,
    caseId: number
): Promise<SupportCase> {
    const {data} = await axios.get<SupportCase>(
        `${SUPPORT_URL}/${caseId}`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * ✏️ Update a support case (status or assignment)
 */
export async function updateSupportCase(
    token: string,
    caseId: number,
    updateData: SupportCaseUpdate
): Promise<SupportCase> {
    const {data} = await axios.put<SupportCase>(
        `${SUPPORT_URL}/${caseId}`,
        updateData,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * 🚫 Close a support case
 */
export async function closeSupportCase(
    token: string,
    caseId: number
): Promise<SupportCase> {
    const {data} = await axios.post<SupportCase>(
        `${SUPPORT_URL}/${caseId}/close`,
        {},
        getAuthHeaders(token)
    );
    return data;
}

/**
 * 💬 Add an admin/staff message to a support case
 */
export async function addCaseMessage(
    token: string,
    caseId: number,
    messageData: CaseMessageCreate
): Promise<CaseMessage> {
    const {data} = await axios.post<CaseMessage>(
        `${SUPPORT_URL}/${caseId}/message`,
        messageData,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * 📊 Get support case metrics
 */
export async function getSupportMetrics(
    token: string
): Promise<SupportMetrics> {
    const {data} = await axios.get<SupportMetrics>(
        `${SUPPORT_URL}/metrics/`,
        getAuthHeaders(token)
    );
    return data;
}

/**
 * ➕ Create a new support case
 */
export async function createSupportCase(
    token: string,
    payload: SupportCaseCreate
): Promise<SupportCase> {
    const {data} = await axios.post<SupportCase>(
        `${SUPPORT_URL}/`,
        payload,
        getAuthHeaders(token)
    );
    return data;
}

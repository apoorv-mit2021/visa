import axios from "axios";

// -----------------------------
// API CONFIG
// -----------------------------
const API_BASE_URL = import.meta.env.VITE_API_URL;
const SUPPORT_URL = `${API_BASE_URL}/admin/support`;

// -----------------------------
// TYPES
// -----------------------------

export interface SupportCase {
    id: number;
    title: string;
    description: string;
    status: "open" | "in_progress" | "closed";
    assigned_to?: number | null;
    user_id: number;
    created_at: string;
    updated_at: string;
    messages?: CaseMessage[];
}

export interface SupportCaseCreate {
    title: string;
    description: string;
    user_id: number;
}

export interface SupportCaseUpdate {
    status?: "open" | "in_progress" | "closed";
    assigned_to?: number | null;
}

export interface CaseMessage {
    id: number;
    case_id: number;
    sender_id: number;
    message: string;
    created_at: string;
}

export interface CaseMessageCreate {
    message: string;
}

export interface SupportMetrics {
    total_cases: number;
    open_cases: number;
    in_progress_cases: number;
    closed_cases: number;
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
 * 📋 Get all support cases (Admin/Staff)
 */
export async function listSupportCases(token: string): Promise<SupportCase[]> {
    const {data} = await axios.get<SupportCase[]>(SUPPORT_URL, getAuthHeaders(token));
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
 * 💬 Add a staff/admin message to a support case
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
export async function getSupportMetrics(token: string): Promise<SupportMetrics> {
    const {data} = await axios.get<SupportMetrics>(
        `${SUPPORT_URL}/metrics/`,
        getAuthHeaders(token)
    );
    return data;
}

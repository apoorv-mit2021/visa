import {FormEvent, useEffect, useMemo, useState} from "react";
import {useAuth} from "../../../context/AuthContext";
import TextArea from "../../../components/form/input/TextArea";
import Radio from "../../form/input/Radio";
import {toast} from "sonner";
import {
    addCaseMessage,
    getSupportCase,
    type CaseMessage,
    type SupportCase,
    type SupportCaseCreate,
    type SupportCaseUpdate,
} from "../../../services/caseService";
import {listStaff, getStaff, type Staff} from "../../../services/employeeService";
import {getOrder, type Order} from "../../../services/orderService";
import {getCustomer, type Customer} from "../../../services/customerService";

export type CaseMode = "create" | "view" | "edit";

type CaseFormProps = {
    mode: CaseMode;
    supportCase?: SupportCase;
    isSubmitting?: boolean;
    onSubmit: (payload: SupportCaseCreate | { id: number; data: SupportCaseUpdate }) => void;
    onModeChange?: (mode: CaseMode) => void;
};

const STATUS_OPTIONS = ["open", "in_progress", "closed"] as const;

export default function CaseForm({
                                     mode,
                                     supportCase,
                                     isSubmitting = false,
                                     onSubmit,
                                     onModeChange,
                                 }: CaseFormProps) {
    const {token} = useAuth();

    // State for create/edit fields
    const {user} = useAuth();
    const [userId] = useState<number | "">(supportCase?.user_id ?? "");
    const [orderId] = useState<number | "">(supportCase?.order_id ?? "");
    const [subject, setSubject] = useState<string>(supportCase?.subject ?? "");
    const [description, setDescription] = useState<string>(supportCase?.description ?? "");
    const [status, setStatus] = useState<string>(supportCase?.status ?? "open");
    const [assignedToId, setAssignedToId] = useState<number | "">(supportCase?.assigned_to_id ?? "");
    const [assignedStaff, setAssignedStaff] = useState<Staff | null>(null);
    const [loadingAssignedStaff, setLoadingAssignedStaff] = useState(false);

    const [isEditing, setIsEditing] = useState<boolean>(mode === "edit");

    // Staff list for assignment
    const [staff, setStaff] = useState<Staff[]>([]);
    const [staffSearch] = useState("");

    // Messages/chat
    const [messages, setMessages] = useState<CaseMessage[]>(supportCase?.messages ?? []);
    const [newMessage, setNewMessage] = useState("");
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loadingCustomer, setLoadingCustomer] = useState(false);

    // UI: tabs
    const [activeTab, setActiveTab] = useState<"details" | "messages">("details");

    // Ensure we don't show Messages tab in create mode
    useEffect(() => {
        if (mode === "create" && activeTab !== "details") {
            setActiveTab("details");
        }
    }, [mode, activeTab]);

    // Prefill when props change
    useEffect(() => {
        setSubject(supportCase?.subject ?? "");
        setDescription(supportCase?.description ?? "");
        setStatus(supportCase?.status ?? (mode === "create" ? "open" : "open"));
        setAssignedToId(supportCase?.assigned_to_id ?? "");
        setIsEditing(mode === "edit");
        setMessages(supportCase?.messages ?? []);
    }, [supportCase, mode]);

    // Fetch full details to ensure messages are fresh
    useEffect(() => {
        let ignore = false;
        const fetchDetails = async () => {
            if (!token || !supportCase?.id) return;
            try {
                setLoadingDetails(true);
                const full = await getSupportCase(token, supportCase.id);
                if (!ignore) {
                    setMessages(full.messages || []);
                }
            } catch {
                // silent
            } finally {
                if (!ignore) setLoadingDetails(false);
            }
        };
        if (mode !== "create") fetchDetails();
        return () => {
            ignore = true;
        };
    }, [token, supportCase?.id, mode]);

    // Fetch assigned staff details when viewing (or when assignedToId changes)
    useEffect(() => {
        let ignore = false;
        const fetchAssigned = async () => {
            if (!token) return;
            // Only fetch when we have an assigned staff id (number)
            if (assignedToId === "" || assignedToId === null || assignedToId === undefined) {
                if (!ignore) setAssignedStaff(null);
                return;
            }
            try {
                setLoadingAssignedStaff(true);
                const staff = await getStaff(token, Number(assignedToId));
                if (!ignore) setAssignedStaff(staff);
            } catch {
                if (!ignore) setAssignedStaff(null);
            } finally {
                if (!ignore) setLoadingAssignedStaff(false);
            }
        };
        fetchAssigned();
        return () => {
            ignore = true;
        };
    }, [token, assignedToId]);

    // Fetch order details for summary
    useEffect(() => {
        let ignore = false;
        const fetchOrder = async () => {
            if (!token) return;
            if (mode === "create") return;
            const oid = supportCase?.order_id ?? (orderId === "" ? undefined : Number(orderId));
            if (!oid) {
                if (!ignore) setOrder(null);
                return;
            }
            try {
                setLoadingOrder(true);
                const data = await getOrder(token, Number(oid));
                if (!ignore) setOrder(data);
            } catch {
                if (!ignore) setOrder(null);
            } finally {
                if (!ignore) setLoadingOrder(false);
            }
        };
        fetchOrder();
        return () => {
            ignore = true;
        };
    }, [token, mode, supportCase?.order_id, orderId]);

    // Fetch customer details to show name in chat bubbles
    useEffect(() => {
        let ignore = false;
        const fetchCustomer = async () => {
            if (!token) return;
            if (mode === "create") return;
            const uid = supportCase?.user_id ?? (userId === "" ? undefined : Number(userId));
            if (!uid) {
                if (!ignore) setCustomer(null);
                return;
            }
            try {
                setLoadingCustomer(true);
                const data = await getCustomer(token, Number(uid));
                if (!ignore) setCustomer(data);
            } catch {
                if (!ignore) setCustomer(null);
            } finally {
                if (!ignore) setLoadingCustomer(false);
            }
        };
        fetchCustomer();
        return () => {
            ignore = true;
        };
    }, [token, mode, supportCase?.user_id, userId]);

    // Load staff list (basic, up to 200)
    useEffect(() => {
        let ignore = false;
        const load = async () => {
            if (!token) return;
            try {
                const all = await listStaff(token, {search: staffSearch || undefined, limit: 200});
                if (!ignore) setStaff(all);
            } catch {
                // silent
            }
        };
        load();
        return () => {
            ignore = true;
        };
    }, [token, staffSearch]);

    const filteredStaff = useMemo(() => {
        const q = staffSearch.toLowerCase();
        if (!q) return staff;
        return staff.filter(s => s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }, [staff, staffSearch]);

    const inputsDisabled = mode !== "create" && !isEditing;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (mode === "create") {
            if (!userId || !subject) {
                toast.error("User ID and subject are required.");
                return;
            }
            const payload: SupportCaseCreate = {
                user_id: Number(userId),
                subject,
                description: description || undefined,
                order_id: orderId === "" ? undefined : Number(orderId),
                assigned_to_id: assignedToId === "" ? undefined : Number(assignedToId),
                status: status || undefined,
            };
            onSubmit(payload);
            return;
        }
        if (supportCase && isEditing) {
            const update: SupportCaseUpdate = {
                status: status,
                assigned_to_id: assignedToId === "" ? null : Number(assignedToId),
            };
            onSubmit({id: supportCase.id, data: update});
        }
    };

    const handleSendMessage = async () => {
        if (!token || !supportCase?.id) return;
        if (!newMessage.trim()) return;
        try {
            const created = await addCaseMessage(token, supportCase.id, {message: newMessage.trim()});
            setMessages(prev => [...prev, created]);
            setNewMessage("");
        } catch {
            toast.error("Failed to send message");
        }
    };

    if (mode !== "create" && !supportCase) {
        return <div className="text-sm text-gray-500 dark:text-gray-400">No case selected.</div>;
    }


    return (
        <div className="flex flex-col h-full">
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">

                <form id="case-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Tabs Header */}
                    <div role="tablist" aria-label="Case tabs" className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "details"}
                            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 -mb-[1px] ${
                                activeTab === "details"
                                    ? "border-blue-600 text-gray-900 dark:text-white"
                                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300"
                            }`}
                            onClick={() => setActiveTab("details")}
                        >
                            Details
                        </button>
                        {mode !== "create" && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === "messages"}
                                className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 -mb-[1px] ${
                                    activeTab === "messages"
                                        ? "border-blue-600 text-gray-900 dark:text-white"
                                        : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300"
                                }`}
                                onClick={() => setActiveTab("messages")}
                            >
                                Messages
                            </button>
                        )}
                    </div>

                    {/* Tabs Content */}
                    {activeTab === "details" && (
                        <div role="tabpanel" aria-label="Details" className="flex flex-col gap-6">
                            <div className="px-2 text-sm font-semibold text-gray-900 dark:text-white">Details</div>

                            {/*Case Details*/}
                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

                                    {/* Subject */}
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                                            Subject
                                        </td>
                                        <td className="px-4 py-3">
                                                <span
                                                    className="font-small text-gray-900 dark:text-white">{subject}
                                                </span>
                                        </td>
                                    </tr>

                                    {/* Description */}
                                    <tr>
                                        <td className="align-top px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                                            Description
                                        </td>
                                        <td className="px-4 py-3">
                                                <span
                                                    className="font-small text-gray-900 dark:text-white">{description}
                                                </span>
                                        </td>
                                    </tr>

                                    {/* Status */}
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                                            Status
                                        </td>
                                        <td className="px-4 py-3">
                                            {inputsDisabled ? (
                                                <span
                                                    className="inline-flex items-center rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {status.replace("_", " ")}
                                    </span>
                                            ) : (
                                                <div className="mt-1 flex flex-wrap items-center gap-6">
                                                    {STATUS_OPTIONS.map((s) => (
                                                        <Radio
                                                            key={s}
                                                            id={`status-${s}`}
                                                            name="status"
                                                            value={s}
                                                            checked={status === s}
                                                            onChange={(val: string) => setStatus(val)}
                                                            label={s.replace("_", " ")}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Assigned To */}
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                                            Assigned To
                                        </td>
                                        <td className="px-4 py-3">
                                            {inputsDisabled ? (
                                                <div className="text-gray-700 dark:text-gray-300">
                                                    {assignedToId === ""
                                                        ? "Unassigned"
                                                        : loadingAssignedStaff
                                                            ? "Loading..."
                                                            : assignedStaff?.full_name
                                                                ? `${assignedStaff.full_name} (${assignedStaff.email})`
                                                                : `#${assignedToId}`}
                                                </div>
                                            ) : (
                                                <select
                                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                    value={assignedToId === "" ? "" : String(assignedToId)}
                                                    onChange={(e) =>
                                                        setAssignedToId(
                                                            e.target.value === "" ? "" : Number(e.target.value)
                                                        )
                                                    }
                                                >
                                                    <option value="">Unassigned</option>
                                                    {filteredStaff.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.full_name} ({s.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                    </tr>

                                    </tbody>
                                </table>
                            </div>

                            {/*Order Summary*/}
                            {mode !== "create" && (
                                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                                    <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 dark:border-gray-800 dark:text-white">
                                        Order Summary
                                    </div>
                                    <div className="p-4 text-sm text-gray-800 dark:text-gray-200">
                                        {loadingOrder ? (
                                            <div className="space-y-3 animate-pulse">
                                                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
                                                <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                                                <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                                            </div>
                                        ) : !order ? (
                                            <div className="text-gray-600 dark:text-gray-400">
                                                {supportCase?.order_id ? "Failed to load order details." : "No order linked to this case."}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="font-medium">Order #{order.id}</div>
                                                    <div className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                                        {order.status}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                    <div>
                                                        <div className="text-xs text-gray-500">Placed</div>
                                                        <div>{new Date(order.created_at).toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500">Updated</div>
                                                        <div>{new Date(order.updated_at).toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500">Total</div>
                                                        <div className="font-medium">₹{order.total_amount?.toFixed?.(2) ?? order.total_amount}</div>
                                                    </div>
                                                </div>
                                                <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
                                                    <div className="mb-2 text-xs font-medium text-gray-500">Items</div>
                                                    <div className="space-y-2">
                                                        {order.items?.length ? (
                                                            order.items.map(it => (
                                                                <div key={it.id} className="flex items-center justify-between">
                                                                    <div className="min-w-0">
                                                                        <div className="truncate">
                                                                            {it.product?.name ?? `Product #${it.product_id}`} {it.size ? `• ${it.size}` : ""}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {it.product?.sku ? `SKU: ${it.product.sku}` : `ID: ${it.product_id}`} • Qty: {it.quantity}
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-4 whitespace-nowrap">₹{(it.price * it.quantity).toFixed(2)}</div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-gray-600 dark:text-gray-400">No items.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "messages" && mode !== "create" && (
                        <div role="tabpanel" aria-label="Messages" className="flex flex-col gap-6">
                            {/*<div className="px-2 text-sm font-semibold text-gray-900 dark:text-white">Messages</div>*/}
                            <div
                                className="flex h-[480px] flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

                                {/* Header */}
                                <div
                                    className="border-b border-gray-100 p-4 text-sm font-medium text-gray-900 dark:border-gray-800 dark:text-white">
                                    Conversation
                                </div>

                                {/* Message List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {loadingDetails ? (
                                        <div className="space-y-3 animate-pulse">
                                            <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800"/>
                                            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800"/>
                                            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-800"/>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                            No messages yet.
                                        </div>
                                    ) : (
                                        messages.map(m => {
                                            const isSelf = m.sender_id === user?.id;
                                            return (
                                                <div
                                                    key={m.id}
                                                    className={`flex w-full ${isSelf ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm 
                                        ${isSelf
                                            ? "bg-gray-900 text-white dark:bg-gray-700"
                                            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                        }`}
                                                    >
                                                        {/* Sender + Time */}
                                                        <div
                                                            className="mb-1 flex items-center justify-between text-xs opacity-70">
                                                            <span>
                                                                {isSelf
                                                                    ? "You"
                                                                    : m.sender_id === (supportCase?.user_id ?? null)
                                                                        ? (loadingCustomer ? "Loading..." : (customer?.full_name ?? `User #${m.sender_id}`))
                                                                        : `User #${m.sender_id}`}
                                                            </span>
                                                            <span>{new Date(m.created_at).toLocaleString()}</span>
                                                        </div>

                                                        {/* Message */}
                                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                            {m.message}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Composer */}
                                <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                                    <div className="flex items-center gap-3 w-full">

                                        {/* Text Area - stretchy full width */}
                                        <div className="flex-1">
                                            <TextArea
                                                rows={2}
                                                value={newMessage}
                                                onChange={setNewMessage}
                                                placeholder="Type a message..."
                                                className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm
                               focus:border-gray-400 focus:ring-gray-400
                               dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                            />
                                        </div>

                                        {/* Send Button - fixed width */}
                                        <button
                                            type="button"
                                            className="flex h-[42px] flex-shrink-0 items-center justify-center
                           rounded-xl bg-gray-900 px-5 text-sm font-medium text-white
                           hover:bg-gray-800 disabled:opacity-50
                           dark:bg-gray-700 dark:hover:bg-gray-600"
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                        >
                                            Send
                                        </button>

                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                {mode === "create" ? (
                    <>
                        <button
                            type="reset"
                            onClick={() => {
                                setSubject("");
                                setDescription("");
                                setStatus("open");
                                setAssignedToId("");
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            form="case-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {isSubmitting ? "Creating..." : "Create Case"}
                        </button>
                    </>
                ) : isEditing ? (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                if (!supportCase) return;
                                setIsEditing(false);
                                onModeChange?.("view");
                                setStatus(supportCase.status);
                                setAssignedToId(supportCase.assigned_to_id ?? "");
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="case-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {isSubmitting ? "Updating..." : "Update"}
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(true);
                            onModeChange?.("edit");
                        }}
                        className="rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
}

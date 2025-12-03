import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge.tsx";
import { getRecentOrders, type Order as DashboardOrder } from "../../../services/dashboardService";
import { Dropdown } from "../../ui/dropdown/Dropdown.tsx";
import { DropdownItem } from "../../ui/dropdown/DropdownItem.tsx";
import { useDropdownPosition } from "../../../hooks/useDropdownPosition";
import { MoreVertical } from "lucide-react";
import { Slider } from "../../common/Slider";
import OrderForm, { type OrderMode } from "../Orders/OrderForm";
import { useModal } from "../../../hooks/useModal";
import { useAuth } from "../../../context/AuthContext";
import { updateOrderStatus } from "../../../services/orderService";
import { toast } from "sonner";
import axios from "axios";

export default function RecentOrders() {
    const [orders, setOrders] = useState<DashboardOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const { token } = useAuth();

    // Action dropdown state
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const { position, calculatePosition, isVisible, hideDropdown } = useDropdownPosition();
    const actionBtnRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const closeAction = () => setOpenActionId(null);

    // Slider modal state for viewing/editing an order
    const { isOpen, openModal, closeModal } = useModal(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [mode, setMode] = useState<OrderMode>("view");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token") || "";
        const load = async () => {
            try {
                setLoading(true);
                const data = await getRecentOrders(token);
                setOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch recent orders:", err);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formatAmount = (value?: number) =>
        typeof value === "number" && isFinite(value) ? `$${value.toFixed(2)}` : "$0.00";

    const formatDate = (iso?: string) => {
        if (!iso) return "—";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleDateString();
    };

    // Align badge mapping similar to Orders table (pending, paid, shipped, delivered, cancelled)
    const getBadge = (status?: string): { label: string; color: "success" | "warning" | "error" | "info" } => {
        const s = (status || "").toLowerCase();
        const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
        if (s === "pending") return { label, color: "warning" };
        if (s === "paid") return { label, color: "info" };
        if (s === "shipped") return { label, color: "info" };
        if (s === "delivered") return { label, color: "success" };
        if (s === "cancelled" || s === "canceled" || s.includes("cancel")) return { label: label === "—" ? "Cancelled" : label, color: "error" };
        if (s.includes("complete")) return { label: "Completed", color: "success" };
        if (s.includes("pend")) return { label: "Pending", color: "warning" };
        return { label: status || "—", color: "info" };
    };
    // Handlers for row actions
    const handleView = (order: DashboardOrder) => {
        setMode("view");
        // Pass minimal fields compatible with OrderForm; it will fetch full details by id
        setSelectedOrder(order as any);
        openModal();
    };

    const handleEdit = (order: DashboardOrder) => {
        setMode("edit");
        setSelectedOrder(order as any);
        openModal();
    };

    const refresh = async () => {
        const t = localStorage.getItem("token") || token || "";
        try {
            const data = await getRecentOrders(t);
            setOrders(Array.isArray(data) ? data : []);
        } catch {
            // noop
        }
    };

    const handleSubmit = async (data: { id: number; status: string }) => {
        const t = token || localStorage.getItem("token") || "";
        if (!t) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }
        try {
            setIsSubmitting(true);
            await updateOrderStatus(t, data.id, data.status);
            toast.success("Order updated!");
            closeModal();
            await refresh();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error((error.response?.data as any)?.detail || "Request failed");
            } else {
                toast.error("Unexpected error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            {/* Order Slider */}
            <Slider
                isOpen={isOpen}
                onClose={() => {
                    setMode("view");
                    closeModal();
                }}
                title={mode === "edit" ? "Edit Order" : "Order Details"}
            >
                <OrderForm
                    mode={mode}
                    order={selectedOrder || undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onModeChange={setMode}
                />
            </Slider>
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Recent Orders
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/orders")}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
                        See all
                    </button>
                </div>
            </div>
            <div className="max-w-full overflow-x-auto">
                <Table>
                    {/* Table Header */}
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Order
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                User
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Status
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Total
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Created
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                            >
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    {/* Table Body */}

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-5 w-5 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell className="py-4 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                                    No recent orders.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const badge = getBadge(order.status);
                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="py-3">
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">Order #
                                                {order.id}</p>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {typeof (order as any).user_id === "number" || typeof (order as any).user_id === "string"
                                                ? (order as any).user_id
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            <Badge size="sm" color={badge.color}>{badge.label}</Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {formatAmount((order as any).total_amount)}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {formatDate((order as any).created_at)}
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    ref={(el) => {
                                                        actionBtnRefs.current[order.id as any] = el;
                                                    }}
                                                    type="button"
                                                    className="dropdown-toggle"
                                                    onClick={() => {
                                                        const button = actionBtnRefs.current[order.id as any];
                                                        if (button) calculatePosition(button, 150, 100);
                                                        setOpenActionId(openActionId === (order.id as any) ? null : (order.id as any));
                                                    }}
                                                    aria-label="Actions"
                                                >
                                                    <MoreVertical className="size-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                                                </button>

                                                {openActionId === (order.id as any) && isVisible && (
                                                    <Dropdown
                                                        isOpen={true}
                                                        onClose={() => {
                                                            closeAction();
                                                            hideDropdown();
                                                        }}
                                                        className="fixed z-50 w-36 p-2 bg-white shadow-lg dark:bg-gray-900 rounded-2xl"
                                                        style={{ top: position.top, left: position.left }}
                                                    >
                                                        <DropdownItem
                                                            onItemClick={() => {
                                                                handleView(order);
                                                                closeAction();
                                                                hideDropdown();
                                                            }}
                                                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                                        >
                                                            View
                                                        </DropdownItem>
                                                        <DropdownItem
                                                            onItemClick={() => {
                                                                handleEdit(order);
                                                                closeAction();
                                                                hideDropdown();
                                                            }}
                                                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                                        >
                                                            Edit
                                                        </DropdownItem>
                                                    </Dropdown>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

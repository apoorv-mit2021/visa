import {useEffect, useMemo, useRef, useState} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge.tsx";
import {listOrders, type Order} from "../../../services/orderService";
import {getCustomer, type Customer} from "../../../services/customerService";
import {toast} from "sonner";
import {Dropdown} from "../../ui/dropdown/Dropdown.tsx";
import {DropdownItem} from "../../ui/dropdown/DropdownItem.tsx";
import {useDropdownPosition} from "../../../hooks/useDropdownPosition";
import { MoreVertical } from "lucide-react";

// Sorting keys for orders
 type SortKey = "id" | "user_id" | "status" | "total" | "created_at";

 export default function OrderTable({
    refreshKey = 0,
    onView,
    onEdit,
    onViewCustomer,
 }: {
    refreshKey?: number;
    onView?: (order: Order) => void;
    onEdit?: (order: Order) => void;
    onViewCustomer?: (customer: Customer) => void;
 }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [sort, setSort] = useState<{ key: SortKey | null; order: "asc" | "desc" }>({ key: null, order: "asc" });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 6;
    const token = localStorage.getItem("token") || "";
    const [customerNames, setCustomerNames] = useState<Record<number, string>>({});

    // Row action dropdown state (modeled after CollectionTable)
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const closeAction = () => setOpenActionId(null);
    const { position, calculatePosition, isVisible, hideDropdown } = useDropdownPosition();
    const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

    // Status filter dropdown positioning (same pattern as CustomerTable)
    const {
        position: statusPosition,
        calculatePosition: calculateStatusPosition,
        isVisible: isStatusVisible,
        hideDropdown: hideStatusDropdown,
    } = useDropdownPosition();
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const statusButtonRef = useRef<HTMLButtonElement | null>(null);
    const closeStatusFilter = () => setShowStatusFilter(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await listOrders(token);
                setOrders(data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch orders list.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [token, refreshKey]);

    // Fetch customer names for displayed orders' user_ids
    useEffect(() => {
        const fetchCustomerNames = async () => {
            const ids = Array.from(
                new Set(
                    orders
                        .map((o) => o.user_id)
                        .filter((id): id is number => typeof id === "number")
                )
            );
            const missing = ids.filter((id) => customerNames[id] === undefined);
            if (missing.length === 0 || !token) return;

            try {
                const results = await Promise.all(
                    missing.map(async (id) => {
                        try {
                            const customer = await getCustomer(token, id);
                            return [id, customer.full_name] as const;
                        } catch (err) {
                            console.error("Failed to fetch customer", id, err);
                            // Fallback to showing the ID as string if API fails
                            return [id, String(id)] as const;
                        }
                    })
                );

                setCustomerNames((prev) => {
                    const updated = {...prev};
                    for (const [id, name] of results) {
                        updated[id] = name;
                    }
                    return updated;
                });
            } catch (e) {
                // noop, errors per-id handled above
            }
        };

        if (orders.length > 0) fetchCustomerNames();
    }, [orders, token]);

    const filteredData = useMemo(() => {
        let data = orders.filter((o) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                String(o.id).includes(q) ||
                String(o.user_id || "").includes(q) ||
                (o.status || "").toLowerCase().includes(q);

            const matchesStatus =
                statusFilter === "All" || (o.status || "") === statusFilter;

            return matchesSearch && matchesStatus;
        });

        if (sort.key) {
            const dir = sort.order === "asc" ? 1 : -1;
            data = [...data].sort((a, b) => {
                switch (sort.key) {
                    case "id":
                        return (a.id - b.id) * dir;
                    case "user_id":
                        return ((a.user_id || 0) - (b.user_id || 0)) * dir;
                    case "status":
                        return (a.status || "").localeCompare(b.status || "") * dir;
                    case "total":
                        return ((a.total_amount || 0) - (b.total_amount || 0)) * dir;
                    case "created_at":
                        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
                    default:
                        return 0;
                }
            });
        }
        return data;
    }, [orders, searchQuery, statusFilter, sort]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const toggleSort = (key: SortKey) => {
        setSort((prev) =>
            prev.key === key ? { key, order: prev.order === "asc" ? "desc" : "asc" } : { key, order: "asc" }
        );
    };

    const sortIndicator = (key: SortKey) => {
        if (sort.key !== key) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
        return <span className="ml-1">{sort.order === "asc" ? "▲" : "▼"}</span>;
    };

    const formatCurrency = (n: number | undefined) =>
        (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

    if (loading) {
        return (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 dark:bg-gray-900 rounded mb-2" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Orders</h3>

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />

                    {/* Status Filter */}
                    <div className="relative inline-block">
                        <button
                            ref={statusButtonRef}
                            type="button"
                            className="dropdown-toggle inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            onClick={() => {
                                const btn = statusButtonRef.current;
                                if (btn) calculateStatusPosition(btn, 150, 140);
                                if (showStatusFilter && isStatusVisible) {
                                    closeStatusFilter();
                                    hideStatusDropdown();
                                } else {
                                    setShowStatusFilter(true);
                                }
                            }}
                        >
                            <svg
                                className="stroke-current fill-white dark:fill-gray-800"
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M2.29004 5.90393H17.7067" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M17.7075 14.0961H2.29085" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z" fill="" stroke="" strokeWidth="1.5" />
                                <path d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z" fill="" stroke="" strokeWidth="1.5" />
                            </svg>
                            Status
                        </button>

                        {showStatusFilter && isStatusVisible && (
                            <Dropdown
                                isOpen={true}
                                onClose={() => {
                                    closeStatusFilter();
                                    hideStatusDropdown();
                                }}
                                className="fixed z-50 w-36 p-2 bg-white shadow-lg dark:bg-gray-900 rounded-2xl"
                                style={{top: statusPosition.top, left: statusPosition.left}}
                            >
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("All");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    All Status
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("pending");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Pending
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("completed");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Completed
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("cancelled");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Cancelled
                                </DropdownItem>
                            </Dropdown>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                        <TableRow>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("id")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Order {sortIndicator("id")}
                                </button>
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("user_id")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    User {sortIndicator("user_id")}
                                </button>
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Status {sortIndicator("status")}
                                </button>
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("total")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Total {sortIndicator("total")}
                                </button>
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("created_at")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Created {sortIndicator("created_at")}
                                </button>
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400 select-none">
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((o) => (
                                <TableRow key={o.id}>
                                    <TableCell className="py-3">
                                        <div>
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">Order #{o.id}</p>
                                            <span className="text-gray-500 text-theme-xs dark:text-gray-400">ID: {o.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {typeof o.user_id === "number" ? (
                                            onViewCustomer ? (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            if (!token) {
                                                                toast.error("Unauthorized. Please log in again.");
                                                                return;
                                                            }
                                                            const customer = await getCustomer(token, o.user_id);
                                                            onViewCustomer(customer);
                                                        } catch (err) {
                                                            console.error("Failed to open customer", o.user_id, err);
                                                            toast.error("Failed to open customer details");
                                                        }
                                                    }}
                                                    className="font-medium text-blue-600 text-theme-sm hover:underline dark:text-blue-400"
                                                >
                                                    {customerNames[o.user_id] ?? o.user_id}
                                                </button>
                                            ) : (
                                                <span>{customerNames[o.user_id] ?? o.user_id}</span>
                                            )
                                        ) : (
                                            "—"
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {(() => {
                                            // Map backend order statuses to badge colors
                                            // Backend statuses: pending, paid, shipped, delivered, cancelled
                                            const status = (o.status || "").toLowerCase();
                                            const color: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark" =
                                                status === "pending"
                                                    ? "warning"
                                                    : status === "paid"
                                                    ? "primary"
                                                    : status === "shipped"
                                                    ? "info"
                                                    : status === "delivered"
                                                    ? "success"
                                                    : status === "cancelled"
                                                    ? "error"
                                                    : "light";
                                            const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
                                            return (
                                                <Badge size="sm" color={color}>
                                                    {label}
                                                </Badge>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatCurrency(o.total_amount)}</TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="py-3 text-right">
                                        <div className="relative inline-block">
                                            <button
                                                ref={(el) => {
                                                    buttonRefs.current[o.id] = el;
                                                }}
                                                type="button"
                                                className="dropdown-toggle"
                                                onClick={() => {
                                                    const button = buttonRefs.current[o.id];
                                                    if (button) calculatePosition(button, 150, 100);
                                                    setOpenActionId(openActionId === o.id ? null : o.id);
                                                }}
                                                aria-label="Actions"
                                            >
                                                <MoreVertical className="size-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                                            </button>

                                            {openActionId === o.id && isVisible && (
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
                                                            onView?.(o);
                                                            closeAction();
                                                            hideDropdown();
                                                        }}
                                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                                    >
                                                        View
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onEdit?.(o);
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400">
                                    No orders found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    <button
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

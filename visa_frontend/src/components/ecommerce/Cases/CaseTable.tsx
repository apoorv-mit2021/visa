import {useEffect, useMemo, useRef, useState} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge.tsx";
import {listSupportCases, type SupportCase} from "../../../services/caseService";
import {getStaff} from "../../../services/employeeService";
import {getCustomer} from "../../../services/customerService";
import {toast} from "sonner";
import {Dropdown} from "../../ui/dropdown/Dropdown.tsx";
import {DropdownItem} from "../../ui/dropdown/DropdownItem.tsx";
import {useDropdownPosition} from "../../../hooks/useDropdownPosition";
import { MoreVertical } from "lucide-react";

// Status order for sorting for support cases
const STATUS_ORDER: Record<SupportCase["status"], number> = {
    open: 1,
    in_progress: 2,
    closed: 3,
};

type SortKey = "subject" | "status" | "created_at";

type SortState = {
    key: SortKey | null;
    order: "asc" | "desc";
};

type CaseTableProps = {
    refreshKey?: number;
    onView?: (c: SupportCase) => void;
    onEdit?: (c: SupportCase) => void;
};

export default function CaseTable({refreshKey = 0, onView, onEdit}: CaseTableProps) {
    const [cases, setCases] = useState<SupportCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [sort, setSort] = useState<SortState>({key: null, order: "asc"});
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const token = localStorage.getItem("token") || "";
    // Caches for resolving IDs to names
    const [staffNameMap, setStaffNameMap] = useState<Record<number, string>>({});
    const [customerNameMap, setCustomerNameMap] = useState<Record<number, string>>({});

    // Row action dropdown state (pattern same as CollectionTable)
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const closeAction = () => setOpenActionId(null);
    const { position, calculatePosition, isVisible, hideDropdown } = useDropdownPosition();
    const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

    // Status filter dropdown positioning (same pattern as OrderTable)
    const {
        position: statusPosition,
        calculatePosition: calculateStatusPosition,
        isVisible: isStatusVisible,
        hideDropdown: hideStatusDropdown,
    } = useDropdownPosition();
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const statusButtonRef = useRef<HTMLButtonElement | null>(null);
    const closeStatusFilter = () => setShowStatusFilter(false);

    // Fetch cases from backend
    useEffect(() => {
        const fetchCases = async () => {
            try {
                setLoading(true);
                const data = await listSupportCases(token);
                setCases(data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch cases.");
            } finally {
                setLoading(false);
            }
        };
        fetchCases();
    }, [token, refreshKey]);

    // Resolve staff and customer names for displayed cases
    useEffect(() => {
        const resolveNames = async () => {
            try {
                // Unique staff IDs (exclude null/undefined)
                const staffIds = Array.from(
                    new Set(
                        cases
                            .map((c) => c.assigned_to_id)
                            .filter((id): id is number => id !== null && id !== undefined)
                    )
                );
                const missingStaffIds = staffIds.filter((id) => staffNameMap[id] === undefined);

                // Unique customer IDs
                const customerIds = Array.from(new Set(cases.map((c) => c.user_id)));
                const missingCustomerIds = customerIds.filter((id) => customerNameMap[id] === undefined);

                const staffPromises = missingStaffIds.map(async (id) => {
                    try {
                        const staff = await getStaff(token, id);
                        return [id, staff.full_name] as const;
                    } catch {
                        return [id, `Staff #${id}`] as const;
                    }
                });

                const customerPromises = missingCustomerIds.map(async (id) => {
                    try {
                        const customer = await getCustomer(token, id);
                        return [id, customer.full_name] as const;
                    } catch {
                        return [id, `Customer #${id}`] as const;
                    }
                });

                const [staffResults, customerResults] = await Promise.all([
                    Promise.all(staffPromises),
                    Promise.all(customerPromises),
                ]);

                if (staffResults.length > 0) {
                    setStaffNameMap((prev) => {
                        const next = {...prev};
                        for (const [id, name] of staffResults) next[id] = name;
                        return next;
                    });
                }

                if (customerResults.length > 0) {
                    setCustomerNameMap((prev) => {
                        const next = {...prev};
                        for (const [id, name] of customerResults) next[id] = name;
                        return next;
                    });
                }
            } catch (error) {
                // Non-blocking: errors already handled per-item, but keep a console for debugging
                console.error("Failed to resolve some names", error);
            }
        };

        if (cases.length > 0 && token) {
            // Only run if there are any missing IDs to resolve
            const hasMissingStaff = cases.some(
                (c) => c.assigned_to_id != null && staffNameMap[c.assigned_to_id] === undefined
            );
            const hasMissingCustomers = cases.some(
                (c) => customerNameMap[c.user_id] === undefined
            );
            if (hasMissingStaff || hasMissingCustomers) {
                resolveNames();
            }
        }
    }, [cases, token, staffNameMap, customerNameMap]);

    // Filter + search + sort
    const filteredData = useMemo(() => {
        let data = cases.filter((c) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                c.subject.toLowerCase().includes(q) ||
                (c.description || "").toLowerCase().includes(q) ||
                c.status.toLowerCase().includes(q);
            const matchesStatus = statusFilter === "All" || c.status === (statusFilter as SupportCase["status"]);
            return matchesSearch && matchesStatus;
        });

        if (sort.key) {
            const dir = sort.order === "asc" ? 1 : -1;
            data = [...data].sort((a, b) => {
                switch (sort.key) {
                    case "subject":
                        return a.subject.localeCompare(b.subject) * dir;
                    case "status":
                        return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir;
                    case "created_at":
                        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
                    default:
                        return 0;
                }
            });
        }
        return data;
    }, [cases, searchQuery, statusFilter, sort]);

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const toggleSort = (key: SortKey) => {
        setSort((prev) => {
            if (prev.key === key) {
                return {key, order: prev.order === "asc" ? "desc" : "asc"};
            }
            return {key, order: "asc"};
        });
    };

    const sortIndicator = (key: SortKey) => {
        if (sort.key !== key) return (
            <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>
        );
        return <span className="ml-1">{sort.order === "asc" ? "▲" : "▼"}</span>;
    };

    const formatDateTime = (iso: string) => new Date(iso).toLocaleString();

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Cases</h3>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search cases..."
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
                                style={{ top: statusPosition.top, left: statusPosition.left }}
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
                                        setStatusFilter("open");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Open
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("in_progress");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    In Progress
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("closed");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Closed
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
                                <button type="button" onClick={() => toggleSort("subject")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Subject {sortIndicator("subject")}
                                </button>
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Status {sortIndicator("status")}
                                </button>
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                Assigned To
                            </TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                Customer
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
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400">
                                    Loading cases...
                                </TableCell>
                            </TableRow>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="py-3">
                                        <div>
                                            <button
                                                type="button"
                                                className="font-medium text-gray-800 text-theme-sm dark:text-white/90 hover:underline"
                                                onClick={() => onView?.(c)}
                                            >
                                                {c.subject}
                                            </button>
                                            <span className="text-gray-500 text-theme-xs dark:text-gray-400 line-clamp-1">{c.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        <Badge
                                            size="sm"
                                            color={c.status === "closed" ? "success" : c.status === "in_progress" ? "info" : "warning"}
                                        >
                                            {c.status.replace("_", " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {c.assigned_to_id == null
                                            ? "Unassigned"
                                            : (staffNameMap[c.assigned_to_id] ?? `Staff #${c.assigned_to_id}`)}
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {customerNameMap[c.user_id] ?? `Customer #${c.user_id}`}
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDateTime(c.created_at)}</TableCell>
                                    <TableCell className="py-3 text-right">
                                        <div className="relative inline-block">
                                            <button
                                                ref={(el) => {
                                                    buttonRefs.current[c.id] = el;
                                                }}
                                                type="button"
                                                className="dropdown-toggle"
                                                onClick={() => {
                                                    const button = buttonRefs.current[c.id];
                                                    if (button) calculatePosition(button, 150, 100);
                                                    setOpenActionId(openActionId === c.id ? null : c.id);
                                                }}
                                                aria-label="Actions"
                                            >
                                                <MoreVertical className="size-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                                            </button>

                                            {openActionId === c.id && isVisible && (
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
                                                            onView?.(c);
                                                            closeAction();
                                                            hideDropdown();
                                                        }}
                                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                                    >
                                                        View
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onEdit?.(c);
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
                                    No cases found
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
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    <button
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

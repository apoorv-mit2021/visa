import {useEffect, useMemo, useRef, useState} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge.tsx";
import {listSupportCases, type SupportCase} from "../../../services/caseService";
import {toast} from "sonner";
import {Dropdown} from "../../ui/dropdown/Dropdown.tsx";
import {DropdownItem} from "../../ui/dropdown/DropdownItem.tsx";
import {useDropdownPosition} from "../../../hooks/useDropdownPosition";

// Status order for sorting for support cases
const STATUS_ORDER: Record<SupportCase["status"], number> = {
    open: 1,
    in_progress: 2,
    closed: 3,
};

type SortKey = "title" | "status" | "created_at";

type SortState = {
    key: SortKey | null;
    order: "asc" | "desc";
};

export default function CaseTable({refreshKey = 0}: { refreshKey?: number }) {
    const [cases, setCases] = useState<SupportCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [sort, setSort] = useState<SortState>({key: null, order: "asc"});
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const token = localStorage.getItem("token") || "";

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

    // Filter + search + sort
    const filteredData = useMemo(() => {
        let data = cases.filter((c) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                c.title.toLowerCase().includes(q) ||
                (c.description || "").toLowerCase().includes(q) ||
                c.status.toLowerCase().includes(q);
            const matchesStatus = statusFilter === "All" || c.status === (statusFilter as SupportCase["status"]);
            return matchesSearch && matchesStatus;
        });

        if (sort.key) {
            const dir = sort.order === "asc" ? 1 : -1;
            data = [...data].sort((a, b) => {
                switch (sort.key) {
                    case "title":
                        return a.title.localeCompare(b.title) * dir;
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
                                <button type="button" onClick={() => toggleSort("title")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Title {sortIndicator("title")}
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
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-6 text-center text-gray-500 dark:text-gray-400">
                                    Loading cases...
                                </TableCell>
                            </TableRow>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="py-3">
                                        <div>
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{c.title}</p>
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
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{c.assigned_to ?? "Unassigned"}</TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{c.user_id}</TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDateTime(c.created_at)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="py-6 text-center text-gray-500 dark:text-gray-400">
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

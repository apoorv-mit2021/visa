import {useEffect, useMemo, useRef, useState} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge.tsx";
import {listStaff, Staff} from "../../../services/employeeService";
import {UserCheck, UserX, UserCircle, MoreVertical} from "lucide-react";
import {Dropdown} from "../../ui/dropdown/Dropdown.tsx";
import {DropdownItem} from "../../ui/dropdown/DropdownItem.tsx";
import {useDropdownPosition} from "../../../hooks/useDropdownPosition";

export default function EmployeeTable({refreshKey = 0, onView, onEdit}: { refreshKey?: number, onView?: (staff: Staff) => void, onEdit?: (staff: Staff) => void }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [showFilters, setShowFilters] = useState(false);
    const [sort, setSort] = useState<{ key: SortKey | null; order: "asc" | "desc" }>({
        key: null,
        order: "asc",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token") || "";

    type SortKey = "full_name" | "email" | "status";

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                setLoading(true);
                const data = await listStaff(token, {limit: 100});
                setStaffList(data);
            } catch (err) {
                console.error("Failed to fetch staff list:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, [token, refreshKey]);

    // Helper: normalize role objects or strings to displayable names
    const getRoleNames = (roles: unknown): string[] => {
        if (!Array.isArray(roles)) return [];
        return roles
            .map((r: any) => (typeof r === "string" ? r : r?.name))
            .filter((v: any): v is string => typeof v === "string" && v.trim().length > 0);
    };

    // Filter and sort logic
    const filteredData = useMemo(() => {
        let data = staffList.filter((s) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                s.full_name?.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                getRoleNames(s.roles).some((role) => role.toLowerCase().includes(q));

            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Active" && s.is_active) ||
                (statusFilter === "Inactive" && !s.is_active);

            return matchesSearch && matchesStatus;
        });

        if (sort.key) {
            const dir = sort.order === "asc" ? 1 : -1;
            data = [...data].sort((a, b) => {
                switch (sort.key) {
                    case "full_name":
                        return (a.full_name || "").localeCompare(b.full_name || "") * dir;
                    case "email":
                        return a.email.localeCompare(b.email) * dir;
                    case "status":
                        return (Number(b.is_active) - Number(a.is_active)) * dir;
                    default:
                        return 0;
                }
            });
        }

        return data;
    }, [staffList, searchQuery, statusFilter, sort]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const toggleSort = (key: SortKey) => {
        setSort((prev) =>
            prev.key === key
                ? {key, order: prev.order === "asc" ? "desc" : "asc"}
                : {key, order: "asc"}
        );
    };

    const sortIndicator = (key: SortKey) => {
        if (sort.key !== key)
            return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
        return <span className="ml-1">{sort.order === "asc" ? "▲" : "▼"}</span>;
    };

    // Row action dropdown state
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const closeAction = () => setOpenActionId(null);

    // Dropdown positioning hook and button refs
    const {position, calculatePosition, isVisible, hideDropdown} = useDropdownPosition();
    const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

    // Filter dropdown positioning
    const {
        position: filterPosition,
        calculatePosition: calculateFilterPosition,
        isVisible: isFilterVisible,
        hideDropdown: hideFilterDropdown
    } = useDropdownPosition();
    const filterButtonRef = useRef<HTMLButtonElement | null>(null);
    const closeFilter = () => setShowFilters(false);

    if (loading) {
        return (
            <div className="p-6 text-gray-500 dark:text-gray-400">Loading employees...</div>
        );
    }

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Employee Directory
                </h3>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search staff..."
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />

                    {/* Filter */}
                    <div className="relative inline-block">
                        <button
                            ref={filterButtonRef}
                            type="button"
                            className="dropdown-toggle inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            onClick={() => {
                                const btn = filterButtonRef.current;
                                if (btn) calculateFilterPosition(btn, 150, 140);
                                if (showFilters && isFilterVisible) {
                                    closeFilter();
                                    hideFilterDropdown();
                                } else {
                                    setShowFilters(true);
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
                                <path
                                    d="M2.29004 5.90393H17.7067"
                                    stroke=""
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M17.7075 14.0961H2.29085"
                                    stroke=""
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                                    fill=""
                                    stroke=""
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                                    fill=""
                                    stroke=""
                                    strokeWidth="1.5"
                                />
                            </svg>
                            Status
                        </button>

                        {showFilters && isFilterVisible && (
                            <Dropdown
                                isOpen={true}
                                onClose={() => {
                                    closeFilter();
                                    hideFilterDropdown();
                                }}
                                className="fixed z-50 w-36 p-2 bg-white shadow-lg dark:bg-gray-900 rounded-2xl"
                                style={{top: filterPosition.top, left: filterPosition.left}}
                            >
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("All");
                                        setCurrentPage(1);
                                        closeFilter();
                                        hideFilterDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    All Status
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("Active");
                                        setCurrentPage(1);
                                        closeFilter();
                                        hideFilterDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Active
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("Inactive");
                                        setCurrentPage(1);
                                        closeFilter();
                                        hideFilterDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Inactive
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
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                <button
                                    type="button"
                                    onClick={() => toggleSort("full_name")}
                                    className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Name {sortIndicator("full_name")}
                                </button>
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                <button
                                    type="button"
                                    onClick={() => toggleSort("email")}
                                    className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Email {sortIndicator("email")}
                                </button>
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Roles</TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                <button
                                    type="button"
                                    onClick={() => toggleSort("status")}
                                    className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Status {sortIndicator("status")}
                                </button>
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((staff) => (
                                <TableRow key={staff.id}>
                                    <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-3">
                                            <UserCircle className="size-8 text-gray-400 dark:text-gray-500"/>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white/90">
                                                    {staff.full_name || "—"}
                                                </p>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID #{staff.id}
                        </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                                        {staff.email}
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                                        {(() => {
                                            const roleNames = getRoleNames(staff.roles);
                                            return roleNames.length ? roleNames.join(", ") : "—";
                                        })()}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Badge
                                            size="sm"
                                            color={staff.is_active ? "success" : "error"}
                                        >
                                            {staff.is_active ? (
                                                <>
                                                    <UserCheck size={14}/> Active
                                                </>
                                            ) : (
                                                <>
                                                    <UserX size={14}/> Inactive
                                                </>
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-right">
                                        <div className="relative inline-block">
                                            <button
                                                ref={(el) => {
                                                    buttonRefs.current[staff.id] = el;
                                                }}
                                                type="button"
                                                className="dropdown-toggle"
                                                onClick={() => {
                                                    const button = buttonRefs.current[staff.id];
                                                    if (button) calculatePosition(button, 150, 100); // width & height of dropdown
                                                    setOpenActionId(openActionId === staff.id ? null : staff.id);
                                                }}
                                                aria-label="Actions"
                                            >
                                                <MoreVertical
                                                    className="size-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"/>
                                            </button>

                                            {openActionId === staff.id && isVisible && (
                                                <Dropdown
                                                    isOpen={true}
                                                    onClose={() => {
                                                        closeAction();
                                                        hideDropdown();
                                                    }}
                                                    className="fixed z-50 w-36 p-2 bg-white shadow-lg dark:bg-gray-900 rounded-2xl"
                                                    style={{top: position.top, left: position.left}}
                                                >
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onView?.(staff);
                                                            closeAction();
                                                            hideDropdown();
                                                        }}
                                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                                    >
                                                        View
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onEdit?.(staff);
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
                                <TableCell colSpan={5} className="py-6 text-center text-gray-500 dark:text-gray-400">
                                    No staff found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Page {currentPage} of {totalPages}
        </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

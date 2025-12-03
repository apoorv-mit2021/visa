import {useEffect, useMemo, useRef, useState} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge.tsx";
import {listCollections, type Collection} from "../../../services/collectionService";
import {toast} from "sonner";
import {CheckCircle, MoreVertical, XCircle, Layers} from "lucide-react";
import {Dropdown} from "../../ui/dropdown/Dropdown.tsx";
import {DropdownItem} from "../../ui/dropdown/DropdownItem.tsx";
import {useDropdownPosition} from "../../../hooks/useDropdownPosition";

// Sorting keys for collections
type SortKey = "name" | "slug" | "status" | "created_at";

export default function CollectionTable({refreshKey = 0, onView, onEdit}: {
    refreshKey?: number;
    onView?: (collection: Collection) => void;
    onEdit?: (collection: Collection) => void
}) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [sort, setSort] = useState<{ key: SortKey | null; order: "asc" | "desc" }>({key: null, order: "asc"});
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const token = localStorage.getItem("token") || "";

    // Row action dropdown state
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const closeAction = () => setOpenActionId(null);
    const {position, calculatePosition, isVisible, hideDropdown} = useDropdownPosition();
    const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

    // Status filter dropdown positioning
    const {
        position: statusPosition,
        calculatePosition: calculateStatusPosition,
        isVisible: isStatusVisible,
        hideDropdown: hideStatusDropdown,
    } = useDropdownPosition();
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const statusButtonRef = useRef<HTMLButtonElement | null>(null);
    const closeStatusFilter = () => setShowStatusFilter(false);

    // Fetch collections
    useEffect(() => {
        const fetchCollections = async () => {
            try {
                setLoading(true);
                const data = await listCollections(token, {limit: 100});
                setCollections(data);
            } catch (error: any) {
                console.error(error);
                toast.error("Failed to fetch collections list.");
            } finally {
                setLoading(false);
            }
        };
        fetchCollections();
    }, [token, refreshKey]);

    // Filter + search + sort
    const filteredData = useMemo(() => {
        let data = collections.filter((c) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                c.name.toLowerCase().includes(q) ||
                (c.slug || "").toLowerCase().includes(q) ||
                (c.description || "").toLowerCase().includes(q);

            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Active" && c.is_active) ||
                (statusFilter === "Inactive" && !c.is_active);

            return matchesSearch && matchesStatus;
        });

        if (sort.key) {
            const dir = sort.order === "asc" ? 1 : -1;
            data = [...data].sort((a, b) => {
                switch (sort.key) {
                    case "name":
                        return a.name.localeCompare(b.name) * dir;
                    case "slug":
                        return (a.slug || "").localeCompare(b.slug || "") * dir;
                    case "status":
                        return (Number(b.is_active) - Number(a.is_active)) * dir;
                    case "created_at":
                        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
                    default:
                        return 0;
                }
            });
        }
        return data;
    }, [collections, searchQuery, statusFilter, sort]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const toggleSort = (key: SortKey) => {
        setSort((prev) =>
            prev.key === key ? {key, order: prev.order === "asc" ? "desc" : "asc"} : {key, order: "asc"}
        );
    };

    const sortIndicator = (key: SortKey) => {
        if (sort.key !== key) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
        return <span className="ml-1">{sort.order === "asc" ? "▲" : "▼"}</span>;
    };

    if (loading) {
        return (
            <div className="p-6 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                Loading collections...
            </div>
        );
    }

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Collections</h3>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search collections..."
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
                                <path d="M2.29004 5.90393H17.7067" stroke="" strokeWidth="1.5" strokeLinecap="round"
                                      strokeLinejoin="round"/>
                                <path d="M17.7075 14.0961H2.29085" stroke="" strokeWidth="1.5" strokeLinecap="round"
                                      strokeLinejoin="round"/>
                                <path
                                    d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                                    fill="" stroke="" strokeWidth="1.5"/>
                                <path
                                    d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                                    fill="" stroke="" strokeWidth="1.5"/>
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
                                        setStatusFilter("Active");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    Active
                                </DropdownItem>
                                <DropdownItem
                                    onItemClick={() => {
                                        setStatusFilter("Inactive");
                                        setCurrentPage(1);
                                        closeStatusFilter();
                                        hideStatusDropdown();
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
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("name")}
                                        className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Collection {sortIndicator("name")}
                                </button>
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("slug")}
                                        className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Slug {sortIndicator("slug")}
                                </button>
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                Products
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                <button type="button" onClick={() => toggleSort("status")}
                                        className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                    Status {sortIndicator("status")}
                                </button>
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400 select-none">
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((col) => (
                                <TableRow key={col.id}>
                                    <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-3">
                                            <Layers className="size-6 text-gray-400 dark:text-gray-500"/>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white/90">{col.name}</p>
                                                <span
                                                    className="text-xs text-gray-500 dark:text-gray-400">ID #{col.id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 dark:text-gray-400">{col.slug}</TableCell>
                                    <TableCell
                                        className="py-3 text-gray-500 dark:text-gray-400">{col.product_ids?.length ?? 0}</TableCell>
                                    <TableCell className="py-3">
                                        <Badge size="sm" color={col.is_active ? "success" : "error"}>
                                            {col.is_active ? (
                                                <>
                                                    <CheckCircle size={14}/> Active
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={14}/> Inactive
                                                </>
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-right">
                                        <div className="relative inline-block">
                                            <button
                                                ref={(el) => {
                                                    buttonRefs.current[col.id] = el;
                                                }}
                                                type="button"
                                                className="dropdown-toggle"
                                                onClick={() => {
                                                    const button = buttonRefs.current[col.id];
                                                    if (button) calculatePosition(button, 150, 100);
                                                    setOpenActionId(openActionId === col.id ? null : col.id);
                                                }}
                                                aria-label="Actions"
                                            >
                                                <MoreVertical
                                                    className="size-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"/>
                                            </button>

                                            {openActionId === col.id && isVisible && (
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
                                                            onView?.(col);
                                                            closeAction();
                                                            hideDropdown();
                                                        }}
                                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                                    >
                                                        View
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onEdit?.(col);
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
                                    No collections found
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
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

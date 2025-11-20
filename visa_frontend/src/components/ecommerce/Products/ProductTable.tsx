import {useEffect, useMemo, useRef, useState} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import {listProducts, type AdminProductListItem} from "../../../services/productService";
import {toast} from "sonner";
import {Loader2, PackageSearch, CheckCircle, XCircle, MoreVertical} from "lucide-react";
import {Dropdown} from "../../ui/dropdown/Dropdown.tsx";
import {DropdownItem} from "../../ui/dropdown/DropdownItem.tsx";
import {useDropdownPosition} from "../../../hooks/useDropdownPosition";

type SortKey = "name" | "category" | "status";

export default function ProductTable({refreshKey = 0, onView, onEdit}: { refreshKey?: number; onView?: (product: AdminProductListItem) => void; onEdit?: (product: AdminProductListItem) => void }) {
    const [products, setProducts] = useState<AdminProductListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [sort, setSort] = useState<{ key: SortKey | null; order: "asc" | "desc" }>({
        key: null,
        order: "asc",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const token = localStorage.getItem("token") || "";

    // Row action dropdown state
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const closeAction = () => setOpenActionId(null);
    const {position, calculatePosition, isVisible, hideDropdown} = useDropdownPosition();
    const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

    // Category filter dropdown positioning
    const {
        position: categoryPosition,
        calculatePosition: calculateCategoryPosition,
        isVisible: isCategoryVisible,
        hideDropdown: hideCategoryDropdown,
    } = useDropdownPosition();
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const categoryButtonRef = useRef<HTMLButtonElement | null>(null);
    const closeCategoryFilter = () => setShowCategoryFilter(false);

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

    // Fetch products from backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await listProducts(token, {limit: 100});
                setProducts(data);
            } catch (error: unknown) {
                console.error(error);
                toast.error("Failed to fetch product list.");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [token, refreshKey]);

    // Unique categories for filters
    const categories = useMemo(() => {
        const unique = new Set<string>();
        products.forEach((p) => unique.add(p.category));
        return ["All", ...Array.from(unique)];
    }, [products]);

    // Filter + search + sort
    const filteredData = useMemo(() => {
        let data = products.filter((p) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q);

            const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Active" && p.is_active) ||
                (statusFilter === "Inactive" && !p.is_active);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        if (sort.key) {
            const dir = sort.order === "asc" ? 1 : -1;
            data = [...data].sort((a, b) => {
                switch (sort.key) {
                    case "name":
                        return a.name.localeCompare(b.name) * dir;
                    case "category":
                        return a.category.localeCompare(b.category) * dir;
                    case "status":
                        return (Number(b.is_active) - Number(a.is_active)) * dir;
                    default:
                        return 0;
                }
            });
        }
        return data;
    }, [products, searchQuery, categoryFilter, statusFilter, sort]);

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

    // Loading State
    if (loading) {
        return (
            <div className="p-6 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Loader2 className="animate-spin size-5"/>
                Loading products...
            </div>
        );
    }

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Product Directory
                </h3>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />

                    {/* Category Filter */}
                    <div className="relative inline-block">
                        <button
                            ref={categoryButtonRef}
                            type="button"
                            className="dropdown-toggle inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                            onClick={() => {
                                const btn = categoryButtonRef.current;
                                if (btn) calculateCategoryPosition(btn, 150, 200);
                                if (showCategoryFilter && isCategoryVisible) {
                                    closeCategoryFilter();
                                    hideCategoryDropdown();
                                } else {
                                    setShowCategoryFilter(true);
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
                            {categoryFilter === "All" ? "All Categories" : categoryFilter}
                        </button>

                        {showCategoryFilter && isCategoryVisible && (
                            <Dropdown
                                isOpen={true}
                                onClose={() => {
                                    closeCategoryFilter();
                                    hideCategoryDropdown();
                                }}
                                className="fixed z-50 w-36 p-2 bg-white shadow-lg dark:bg-gray-900 rounded-2xl"
                                style={{top: categoryPosition.top, left: categoryPosition.left}}
                            >
                                <DropdownItem
                                    onItemClick={() => {
                                        setCategoryFilter("All");
                                        setCurrentPage(1);
                                        closeCategoryFilter();
                                        hideCategoryDropdown();
                                    }}
                                    className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                >
                                    All Categories
                                </DropdownItem>
                                {categories.filter((c) => c !== "All").map((cat) => (
                                    <DropdownItem
                                        key={cat}
                                        onItemClick={() => {
                                            setCategoryFilter(cat);
                                            setCurrentPage(1);
                                            closeCategoryFilter();
                                            hideCategoryDropdown();
                                        }}
                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                    >
                                        {cat}
                                    </DropdownItem>
                                ))}
                            </Dropdown>
                        )}
                    </div>

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
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleSort("name")}
                                    className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Product {sortIndicator("name")}
                                </button>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleSort("category")}
                                    className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Category {sortIndicator("category")}
                                </button>
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none"
                            >
                                Status
                            </TableCell>
                            <TableCell
                                isHeader
                                className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400 select-none"
                            >
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="py-3 text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-3">
                                            <PackageSearch className="size-6 text-gray-400 dark:text-gray-500"/>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white/90">
                                                    {product.name}
                                                </p>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                          ID #{product.id}
                        </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                                        {product.category}
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Badge size="sm" color={product.is_active ? "success" : "error"}>
                                            {product.is_active ? (
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
                                                    buttonRefs.current[product.id] = el;
                                                }}
                                                type="button"
                                                className="dropdown-toggle"
                                                onClick={() => {
                                                    const button = buttonRefs.current[product.id];
                                                    if (button) calculatePosition(button, 150, 100);
                                                    setOpenActionId(openActionId === product.id ? null : product.id);
                                                }}
                                                aria-label="Actions"
                                            >
                                                <MoreVertical className="size-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"/>
                                            </button>

                                            {openActionId === product.id && isVisible && (
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
                                                            onView?.(product);
                                                            closeAction();
                                                            hideDropdown();
                                                        }}
                                                        className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                                    >
                                                        View
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        onItemClick={() => {
                                                            onEdit?.(product);
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
                                <TableCell colSpan={4} className="py-6 text-center text-gray-500 dark:text-gray-400">
                                    No products found
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
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

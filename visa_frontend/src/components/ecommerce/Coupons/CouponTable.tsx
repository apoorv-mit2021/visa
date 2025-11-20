import {useEffect, useMemo, useRef, useState} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge.tsx";
import {listCoupons, type Coupon} from "../../../services/couponService";
import {toast} from "sonner";
import {Dropdown} from "../../ui/dropdown/Dropdown.tsx";
import {DropdownItem} from "../../ui/dropdown/DropdownItem.tsx";
import {useDropdownPosition} from "../../../hooks/useDropdownPosition";
import {MoreVertical} from "lucide-react";

 type SortKey = "code" | "discount_type" | "discount_value" | "used_count" | "created_at" | "status";

 type CouponTableProps = {
     refreshKey?: number;
     onView?: (id: number) => void;
     onEdit?: (id: number) => void;
 };

 export default function CouponTable({refreshKey = 0, onView, onEdit}: CouponTableProps) {
     const [coupons, setCoupons] = useState<Coupon[]>([]);
     const [loading, setLoading] = useState(true);
     const [searchQuery, setSearchQuery] = useState("");
     const [statusFilter, setStatusFilter] = useState<string>("All");
     const [typeFilter, setTypeFilter] = useState<string>("All");
     const [sort, setSort] = useState<{ key: SortKey | null; order: "asc" | "desc" }>({ key: null, order: "asc" });
     const [currentPage, setCurrentPage] = useState(1);
     const rowsPerPage = 5;
     const token = localStorage.getItem("token") || "";

     // Row action dropdown state (per-row actions like View/Edit)
     const [openActionId, setOpenActionId] = useState<number | null>(null);
     const closeAction = () => setOpenActionId(null);
     const {
         position: actionPosition,
         calculatePosition: calculateActionPosition,
         isVisible: isActionVisible,
         hideDropdown: hideActionDropdown,
     } = useDropdownPosition();
     const actionButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

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

     // Type filter dropdown positioning
     const {
         position: typePosition,
         calculatePosition: calculateTypePosition,
         isVisible: isTypeVisible,
         hideDropdown: hideTypeDropdown,
     } = useDropdownPosition();
     const [showTypeFilter, setShowTypeFilter] = useState(false);
     const typeButtonRef = useRef<HTMLButtonElement | null>(null);
     const closeTypeFilter = () => setShowTypeFilter(false);

     useEffect(() => {
         const fetchCoupons = async () => {
             try {
                 setLoading(true);
                 const data = await listCoupons(token, { limit: 200 });
                 setCoupons(data);
             } catch (error) {
                 console.error(error);
                 toast.error("Failed to fetch coupons list.");
             } finally {
                 setLoading(false);
             }
         };
         fetchCoupons();
     }, [token, refreshKey]);

     const filteredData = useMemo(() => {
         let data = coupons.filter((c) => {
             const q = searchQuery.toLowerCase();
             const matchesSearch =
                 c.code.toLowerCase().includes(q) ||
                 (c.description || "").toLowerCase().includes(q) ||
                 c.discount_type.toLowerCase().includes(q);

             const matchesStatus =
                 statusFilter === "All" ||
                 (statusFilter === "Active" && c.is_active) ||
                 (statusFilter === "Inactive" && !c.is_active);

             const matchesType = typeFilter === "All" || c.discount_type === typeFilter;

             return matchesSearch && matchesStatus && matchesType;
         });

         if (sort.key) {
             const dir = sort.order === "asc" ? 1 : -1;
             data = [...data].sort((a, b) => {
                 switch (sort.key) {
                     case "code":
                         return a.code.localeCompare(b.code) * dir;
                     case "discount_type":
                         return a.discount_type.localeCompare(b.discount_type) * dir;
                     case "discount_value":
                         return ((a.discount_value ?? 0) - (b.discount_value ?? 0)) * dir;
                     case "used_count":
                         return (a.used_count - b.used_count) * dir;
                     case "created_at":
                         return ((a.created_at ? new Date(a.created_at).getTime() : 0) -
                             (b.created_at ? new Date(b.created_at).getTime() : 0)) * dir;
                     case "status":
                         return (Number(a.is_active) - Number(b.is_active)) * dir;
                     default:
                         return 0;
                 }
             });
         }
         return data;
     }, [coupons, searchQuery, statusFilter, typeFilter, sort]);

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

     // Helper to safely format discount values
     const renderDiscountValue = (c: Coupon) => {
         if (c.discount_type === "percentage") {
             return c.discount_value != null ? `${c.discount_value}%` : "—";
         }
         // For fixed discounts, discount_value may be null; avoid calling toFixed on null
         // If a consolidated fixed amount isn't available, render a dash
         if (typeof (c as any).discount_value === "number") {
             return `$${(c as any).discount_value.toFixed(2)}`;
         }
         // If backend provides per-currency fixed_discounts, show a compact summary
         const fixed = (c as any).fixed_discounts as Record<string, number> | undefined;
         if (fixed && Object.keys(fixed).length > 0) {
             return Object.entries(fixed)
                 .map(([cur, val]) => `${cur} ${Number(val).toFixed(2)}`)
                 .join(", ");
         }
         return "—";
     };

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
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Coupons</h3>

                 <div className="flex flex-wrap items-center gap-3">
                     <input
                         type="text"
                         placeholder="Search coupons..."
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

                     {/* Type Filter */}
                     <div className="relative inline-block">
                         <button
                             ref={typeButtonRef}
                             type="button"
                             className="dropdown-toggle inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                             onClick={() => {
                                 const btn = typeButtonRef.current;
                                 if (btn) calculateTypePosition(btn, 150, 140);
                                 if (showTypeFilter && isTypeVisible) {
                                     closeTypeFilter();
                                     hideTypeDropdown();
                                 } else {
                                     setShowTypeFilter(true);
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
                             Type
                         </button>

                         {showTypeFilter && isTypeVisible && (
                             <Dropdown
                                 isOpen={true}
                                 onClose={() => {
                                     closeTypeFilter();
                                     hideTypeDropdown();
                                 }}
                                 className="fixed z-50 w-36 p-2 bg-white shadow-lg dark:bg-gray-900 rounded-2xl"
                                 style={{top: typePosition.top, left: typePosition.left}}
                             >
                                 <DropdownItem
                                     onItemClick={() => {
                                         setTypeFilter("All");
                                         setCurrentPage(1);
                                         closeTypeFilter();
                                         hideTypeDropdown();
                                     }}
                                     className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                 >
                                     All Types
                                 </DropdownItem>
                                 <DropdownItem
                                     onItemClick={() => {
                                         setTypeFilter("percentage");
                                         setCurrentPage(1);
                                         closeTypeFilter();
                                         hideTypeDropdown();
                                     }}
                                     className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                 >
                                     Percentage
                                 </DropdownItem>
                                 <DropdownItem
                                     onItemClick={() => {
                                         setTypeFilter("fixed");
                                         setCurrentPage(1);
                                         closeTypeFilter();
                                         hideTypeDropdown();
                                     }}
                                     className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                 >
                                     Fixed
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
                                 <button type="button" onClick={() => toggleSort("code")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                     Code {sortIndicator("code")}
                                 </button>
                             </TableCell>
                             <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                 <button type="button" onClick={() => toggleSort("discount_type")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                     Type {sortIndicator("discount_type")}
                                 </button>
                             </TableCell>
                             <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                 <button type="button" onClick={() => toggleSort("discount_value")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                     Value {sortIndicator("discount_value")}
                                 </button>
                             </TableCell>
                             <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                 <button type="button" onClick={() => toggleSort("used_count")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                     Used {sortIndicator("used_count")}
                                 </button>
                             </TableCell>
                             <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                 <button type="button" onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                                     Status {sortIndicator("status")}
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
                             paginatedData.map((c) => (
                                 <TableRow key={c.id}>
                                     <TableCell className="py-3">
                                         <div className="flex items-center gap-3">
                                             <div>
                                                 <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{c.code}</p>
                                                 <span className="text-gray-500 text-theme-xs dark:text-gray-400">{c.description || "—"}</span>
                                             </div>
                                         </div>
                                     </TableCell>
                                     <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 capitalize">{c.discount_type}</TableCell>
                                     <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                         {renderDiscountValue(c)}
                                     </TableCell>
                                     <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{c.used_count}</TableCell>
                                     <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                         <Badge size="sm" color={c.is_active ? "success" : "error"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                                     </TableCell>
                                     <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                         {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                                     </TableCell>
                                     <TableCell className="py-3 text-right">
                                         <div className="relative inline-block">
                                             <button
                                                 ref={(el) => {
                                                     actionButtonRefs.current[c.id] = el;
                                                 }}
                                                 type="button"
                                                 className="dropdown-toggle"
                                                 onClick={() => {
                                                     const button = actionButtonRefs.current[c.id];
                                                     if (button) calculateActionPosition(button, 150, 100);
                                                     setOpenActionId(openActionId === c.id ? null : c.id);
                                                 }}
                                                 aria-label="Actions"
                                             >
                                                 <MoreVertical className="size-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
                                             </button>

                                             {openActionId === c.id && isActionVisible && (
                                                 <Dropdown
                                                     isOpen={true}
                                                     onClose={() => {
                                                         closeAction();
                                                         hideActionDropdown();
                                                     }}
                                                     className="fixed z-50 w-36 p-2 bg-white shadow-lg dark:bg-gray-900 rounded-2xl"
                                                     style={{ top: actionPosition.top, left: actionPosition.left }}
                                                 >
                                                     <DropdownItem
                                                         onItemClick={() => {
                                                             onView?.(c.id);
                                                             closeAction();
                                                             hideActionDropdown();
                                                         }}
                                                         className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                                     >
                                                         View
                                                     </DropdownItem>
                                                     <DropdownItem
                                                         onItemClick={() => {
                                                             onEdit?.(c.id);
                                                             closeAction();
                                                             hideActionDropdown();
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
                                 <TableCell colSpan={7} className="py-6 text-center text-gray-500 dark:text-gray-400">
                                     No coupons found
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

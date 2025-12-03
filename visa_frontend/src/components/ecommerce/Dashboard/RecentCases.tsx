import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { type SupportCase } from "../../../services/caseService";
import { getRecentCases } from "../../../services/dashboardService";
import { getStaff } from "../../../services/employeeService";
import { getCustomer } from "../../../services/customerService";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import { useDropdownPosition } from "../../../hooks/useDropdownPosition";
import { MoreVertical } from "lucide-react";

type RecentCasesProps = {
    onView?: (c: SupportCase) => void;
    onEdit?: (c: SupportCase) => void;
};

export default function RecentCases({ onView, onEdit }: RecentCasesProps) {
    const [cases, setCases] = useState<SupportCase[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Name caches
    const [staffNameMap, setStaffNameMap] = useState<Record<number, string>>({});
    const [customerNameMap, setCustomerNameMap] = useState<Record<number, string>>({});

    // Action dropdown state
    const [openActionId, setOpenActionId] = useState<number | null>(null);
    const { position, calculatePosition, isVisible, hideDropdown } = useDropdownPosition();
    const actionBtnRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const closeAction = () => setOpenActionId(null);

    useEffect(() => {
        const token = localStorage.getItem("token") || "";
        const load = async () => {
            try {
                setLoading(true);
                const data = await getRecentCases(token);
                setCases(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch recent cases:", err);
                setCases([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Resolve names for displayed cases only
    useEffect(() => {
        const token = localStorage.getItem("token") || "";
        const resolve = async () => {
            try {
                const staffIds = Array.from(
                    new Set(
                        cases
                            .map((c) => c.assigned_to_id)
                            .filter((id): id is number => id !== null && id !== undefined)
                    )
                );
                const customerIds = Array.from(new Set(cases.map((c) => c.user_id)));

                const missingStaff = staffIds.filter((id) => staffNameMap[id] === undefined);
                const missingCustomers = customerIds.filter((id) => customerNameMap[id] === undefined);

                const staffResults = await Promise.all(
                    missingStaff.map(async (id) => {
                        try {
                            const s = await getStaff(token, id);
                            return [id, s.full_name] as const;
                        } catch {
                            return [id, `Staff #${id}`] as const;
                        }
                    })
                );

                const customerResults = await Promise.all(
                    missingCustomers.map(async (id) => {
                        try {
                            const c = await getCustomer(token, id);
                            return [id, c.full_name] as const;
                        } catch {
                            return [id, `Customer #${id}`] as const;
                        }
                    })
                );

                if (staffResults.length) {
                    setStaffNameMap((prev) => {
                        const next = { ...prev };
                        for (const [id, name] of staffResults) next[id] = name;
                        return next;
                    });
                }
                if (customerResults.length) {
                    setCustomerNameMap((prev) => {
                        const next = { ...prev };
                        for (const [id, name] of customerResults) next[id] = name;
                        return next;
                    });
                }
            } catch (e) {
                console.error("Failed to resolve some names", e);
            }
        };
        if (cases.length) resolve();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cases]);

    const formatDateTime = (iso?: string) => {
        if (!iso) return "—";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "—";
        return d.toLocaleString();
    };

    const statusBadge = (status?: SupportCase["status"]) => {
        const s = (status || "").toLowerCase();
        if (s === "closed") return { label: "closed", color: "success" as const };
        if (s === "in_progress") return { label: "in progress", color: "info" as const };
        return { label: s || "open", color: "warning" as const };
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Cases</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/cases")}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                        See all
                    </button>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                        <TableRow>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">Subject</TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">Status</TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">Assigned To</TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">Customer</TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">Created</TableCell>
                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400 select-none">Action</TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-5 w-5 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : cases.length === 0 ? (
                            <TableRow>
                                <TableCell className="py-4 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                                    No recent cases.
                                </TableCell>
                            </TableRow>
                        ) : (
                            cases.map((c) => {
                                const b = statusBadge(c.status);
                                return (
                                    <TableRow key={c.id}>
                                        <TableCell className="py-3">
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 line-clamp-1">{c.subject}</p>
                                            {c.description && (
                                                <span className="text-gray-500 text-theme-xs dark:text-gray-400 line-clamp-1">{c.description}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            <Badge size="sm" color={b.color}>{b.label}</Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {c.assigned_to_id == null ? "Unassigned" : (staffNameMap[c.assigned_to_id] ?? `Staff #${c.assigned_to_id}`)}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {customerNameMap[c.user_id] ?? `Customer #${c.user_id}`}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {formatDateTime(c.created_at)}
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    ref={(el) => {
                                                        actionBtnRefs.current[c.id] = el;
                                                    }}
                                                    type="button"
                                                    className="dropdown-toggle"
                                                    onClick={() => {
                                                        const button = actionBtnRefs.current[c.id];
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
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
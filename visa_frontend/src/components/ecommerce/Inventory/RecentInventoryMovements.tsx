import {useEffect, useState} from "react";
import {getInventoryMovements, InventoryMovement} from "../../../services/inventoryService";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import {getStaff, Staff} from "../../../services/employeeService";

interface Props {
    refreshKey?: number;
}

export default function RecentInventoryMovements({refreshKey = 0}: Props) {
    const token = localStorage.getItem("token") || "";
    const [data, setData] = useState<InventoryMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [skip, setSkip] = useState(0);
    const [staffById, setStaffById] = useState<Record<number, Staff>>({});
    const limit = 10;

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const result = await getInventoryMovements(token, { offset: skip, limit });
            setData(result);

            // Fetch and cache staff details for performed_by_id
            const ids = Array.from(
                new Set(
                    result
                        .map((m) => m.performed_by_id)
                        .filter((id): id is number => typeof id === "number" && Number.isFinite(id))
                )
            );

            const missingIds = ids.filter((id) => !staffById[id]);
            if (missingIds.length > 0) {
                try {
                    const entries = await Promise.all(
                        missingIds.map(async (id) => {
                            try {
                                const staff = await getStaff(token, id);
                                return [id, staff] as const;
                            } catch (e) {
                                console.error("Failed to fetch staff:", id, e);
                                return null;
                            }
                        })
                    );

                    const update: Record<number, Staff> = {};
                    for (const item of entries) {
                        if (item) {
                            const [id, staff] = item;
                            update[id] = staff;
                        }
                    }
                    if (Object.keys(update).length > 0) {
                        setStaffById((prev) => ({ ...prev, ...update }));
                    }
                } catch (e) {
                    // Already logged per-item; no-op
                }
            }
        } catch (err) {
            console.error("Failed to fetch movements:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, [refreshKey, skip]);

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">

            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Recent Inventory Movements
            </h3>

            {/* Loading Skeleton */}
            {loading ? (
                <div className="animate-pulse">
                    <div className="mb-4 h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="mb-2 h-10 rounded bg-gray-100 dark:bg-gray-900" />
                    ))}
                </div>
            ) : (
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Date</TableCell>
                                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Product</TableCell>
                                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Change</TableCell>
                                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Reason</TableCell>
                                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Performed By</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {data.length > 0 ? (
                                data.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{new Date(m.created_at).toLocaleString()}</TableCell>
                                        <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">#{m.product_id}</TableCell>
                                        <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                                            <Badge size="sm" color={m.change >= 0 ? "success" : "error"}>
                                                {m.change > 0 ? `+${m.change}` : m.change}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400 capitalize">{m.reason.replace("_", " ")}</TableCell>
                                        <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                                            {m.performed_by_id
                                                ? (staffById[m.performed_by_id]?.full_name ?? `User #${m.performed_by_id}`)
                                                : "System"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-6 text-center text-gray-500 dark:text-gray-400">
                                        No recent movements
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Page {Math.floor(skip / limit) + 1}</span>
                <div className="flex gap-2">
                    <button
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        disabled={skip === 0}
                        onClick={() => setSkip((s) => Math.max(0, s - limit))}
                    >
                        Prev
                    </button>
                    <button
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                        disabled={data.length < limit}
                        onClick={() => setSkip((s) => s + limit)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

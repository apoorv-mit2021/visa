import {useEffect, useState} from "react";
import {getLowStockVariants, LowStockVariant} from "../../../services/inventoryService";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge";

export default function LowStockTable() {
    const token = localStorage.getItem("token") || "";
    const [data, setData] = useState<LowStockVariant[]>([]);
    const [loading, setLoading] = useState(true);

    const [skip, setSkip] = useState(0);
    const limit = 10;
    const threshold = 10;

    const fetchLowStock = async () => {
        try {
            setLoading(true);
            const result = await getLowStockVariants(token, {skip, limit, threshold});
            setData(result);
        } catch (err) {
            console.error("Failed to fetch low stock:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLowStock();
    }, [skip]);

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Low Stock Variants
            </h3>

            {loading ? (
                <div className="animate-pulse">
                    <div className="mb-4 h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-800"/>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="mb-2 h-10 rounded bg-gray-100 dark:bg-gray-900"/>
                    ))}
                </div>
            ) : (
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader
                                           className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Product</TableCell>
                                <TableCell isHeader
                                           className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Variant</TableCell>
                                <TableCell isHeader
                                           className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Stock</TableCell>
                                <TableCell isHeader
                                           className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Status</TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {data.length > 0 ? (
                                data.map((item) => (
                                    <TableRow key={item.variant_id}>
                                        <TableCell
                                            className="py-3 text-theme-sm text-gray-800 dark:text-white/90">{item.product_name}</TableCell>
                                        <TableCell
                                            className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{item.variant_name ?? "—"}</TableCell>
                                        <TableCell
                                            className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{item.stock_quantity}</TableCell>
                                        <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                                            <Badge size="sm" color={item.stock_quantity === 0 ? "error" : "warning"}>
                                                {item.stock_quantity === 0 ? "Out of Stock" : "Low Stock"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4}
                                               className="py-6 text-center text-gray-500 dark:text-gray-400">
                                        No low stock variants
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

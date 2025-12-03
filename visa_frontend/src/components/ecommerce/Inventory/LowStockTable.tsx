import {useEffect, useState} from "react";
import {getLowStockProducts, LowStockProduct} from "../../../services/inventoryService";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge";

export default function LowStockTable() {
    const token = localStorage.getItem("token") || "";
    const [data, setData] = useState<LowStockProduct[]>([]);
    const [loading, setLoading] = useState(true);

    const threshold = 10;

    const fetchLowStock = async () => {
        try {
            setLoading(true);
            const result = await getLowStockProducts(token, { threshold });
            setData(result);
        } catch (err) {
            console.error("Failed to fetch low stock:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLowStock();
    }, []);

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Low Stock Products
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
                                           className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">SKU</TableCell>
                                <TableCell isHeader
                                           className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Low Sizes</TableCell>
                                <TableCell isHeader
                                           className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 select-none">Total Stock</TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {data.length > 0 ? (
                                data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell
                                            className="py-3 text-theme-sm text-gray-800 dark:text-white/90">{item.name}</TableCell>
                                        <TableCell
                                            className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{item.sku}</TableCell>
                                        <TableCell
                                            className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                                            {Object.entries(item.low_sizes).length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(item.low_sizes).map(([size, qty]) => (
                                                        <Badge key={size} size="sm" color={qty === 0 ? "error" : "warning"}>
                                                            {size}: {qty}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{item.total_stock}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4}
                                               className="py-6 text-center text-gray-500 dark:text-gray-400">
                                        No low stock products
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* No pagination for product-level low-stock view */}
        </div>
    );
}

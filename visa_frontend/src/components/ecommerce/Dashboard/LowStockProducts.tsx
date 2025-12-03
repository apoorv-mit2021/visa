import {useEffect, useState} from "react";
import {Table, TableBody, TableCell, TableHeader, TableRow} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import {getLowStockProducts} from "../../../services/dashboardService.ts";
import {type LowStockProduct} from "../../../services/inventoryService";
import {Link} from "react-router-dom";

export default function LowStockProducts() {
    const [items, setItems] = useState<LowStockProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const token = localStorage.getItem("token") || "";
        const load = async () => {
            try {
                setLoading(true);
                const data = await getLowStockProducts(token);
                setItems(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch low stock products:", err);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Low Stock Products
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Products that need restocking soon
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                        See all
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                        <TableRow>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                Product
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                SKU
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                Low Sizes
                            </TableCell>
                            <TableCell isHeader
                                       className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none">
                                Total Stock
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"/>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"/>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-6 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"/>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="h-4 w-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"/>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell className="py-4 text-center text-gray-500 dark:text-gray-400" colSpan={4}>
                                    No low stock products
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="py-3">
                                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                            {item.name}
                                        </p>
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {item.sku}
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
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
                                    <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {item.total_stock}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

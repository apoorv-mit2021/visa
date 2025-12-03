import {useEffect, useState} from "react";
import {
    Package,
    CheckCircle,
    Layers,
    AlertTriangle,
} from "lucide-react";
import Badge from "../../ui/badge/Badge";
import {getProductMetrics} from "../../../services/productService";
import type {ProductMetrics as ProductMetricsType} from "../../../services/productService";
import axios from "axios";

export default function ProductMetrics({refreshKey = 0}: { refreshKey?: number }) {
    const [metrics, setMetrics] = useState<ProductMetricsType | null>(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token") || "";

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const data = await getProductMetrics(token);
                setMetrics(data);
            } catch (error: unknown) {
                console.error("Failed to fetch product metrics:", error);
                if (axios.isAxiosError(error)) {
                    const message =
                        (error.response?.data as { detail?: string } | undefined)?.detail ||
                        "Failed to load product metrics.";
                    console.error(message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [token, refreshKey]);

    if (loading || !metrics) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse"
                    >
                        <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
                        <div className="mt-5 space-y-2">
                            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-2/3"></div>
                            <div className="h-6 bg-gray-300 rounded dark:bg-gray-600 w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {/* Total Products */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Package className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Products
            </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {metrics.total_products}
                        </h4>
                    </div>
                    <Badge color="success">Listed</Badge>
                </div>
            </div>

            {/* Active Products */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <CheckCircle className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active Products
            </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {metrics.active_products}
                        </h4>
                    </div>
                    <Badge color="success">Active</Badge>
                </div>
            </div>

            {/* Total Variants */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Layers className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Inactive Products
            </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {metrics.inactive_products}
                        </h4>
                    </div>
                    <Badge color="info">Inactive</Badge>
                </div>
            </div>

            {/* Low Stock */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <AlertTriangle className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Low Stock Products
            </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {metrics.low_stock_products}
                        </h4>
                    </div>
                    <Badge color="error">Low</Badge>
                </div>
            </div>
        </div>
    );
}

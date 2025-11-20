import {useEffect, useState} from "react";
import {Users, ShieldCheck, ClipboardList, Gauge} from "lucide-react";
import Badge from "../../ui/badge/Badge";
import {getCustomerMetrics} from "../../../services/customerService";
import type {CustomerMetrics as CustomerMetricsType} from "../../../services/customerService";
import axios from "axios";

export default function CustomerMetrics({refreshKey = 0}: { refreshKey?: number }) {
    const [metrics, setMetrics] = useState<CustomerMetricsType | null>(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token") || "";

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const data = await getCustomerMetrics(token);
                setMetrics(data);
            } catch (error: unknown) {
                console.error("Failed to fetch customer metrics:", error);
                if (axios.isAxiosError(error)) {
                    const message = (error.response?.data as { detail?: string } | undefined)?.detail || "Failed to load customer metrics.";
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
                    <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
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
            {/* Total Customers */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Users className="text-gray-800 size-6 dark:text-white/90" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Customers</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.total_clients}</h4>
                    </div>
                    <Badge color="info">Total</Badge>
                </div>
            </div>

            {/* Verified Customers */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <ShieldCheck className="text-gray-800 size-6 dark:text-white/90" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Verified Customers</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.verified_clients}</h4>
                    </div>
                    <Badge color="success">Verified</Badge>
                </div>
            </div>

            {/* Total Orders */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <ClipboardList className="text-gray-800 size-6 dark:text-white/90" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Orders</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.total_orders}</h4>
                    </div>
                    <Badge color="info">Orders</Badge>
                </div>
            </div>

            {/* Avg Orders per Customer */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Gauge className="text-gray-800 size-6 dark:text-white/90" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Avg. Orders / Customer</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.avg_orders_per_client}</h4>
                    </div>
                    <Badge color="warning">Average</Badge>
                </div>
            </div>
        </div>
    );
}

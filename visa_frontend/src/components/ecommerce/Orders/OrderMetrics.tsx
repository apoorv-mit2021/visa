import {useEffect, useState} from "react";
import axios from "axios";
import Badge from "../../ui/badge/Badge";
import {getOrderMetrics} from "../../../services/orderService";
import type { OrderMetrics as OrderMetricsType } from "../../../services/orderService";
import {ShoppingBag, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, CalendarDays} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function OrderMetrics({refreshKey = 0}: { refreshKey?: number }) {
    const [metrics, setMetrics] = useState<OrderMetricsType | null>(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const authToken = token || "";

    const formatAmount = (value: number) =>
        value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                if (!authToken) {
                    setMetrics(null);
                    return;
                }
                const data = await getOrderMetrics(authToken);
                setMetrics(data);
            } catch (error: unknown) {
                console.error("Failed to fetch order metrics:", error);
                if (axios.isAxiosError(error)) {
                    const message = (error.response?.data as {
                        detail?: string
                    } | undefined)?.detail || "Failed to load order metrics.";
                    console.error(message);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, [authToken, refreshKey]);

    if (loading || !metrics) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i}
                         className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
                        <div className="mt-5 space-y-2">
                            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-2/3"></div>
                            <div className="h-6 bg-gray-300 rounded dark:bg-gray-600 w-1/2"></div>
                        </div>
                    </div>
                ))}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 sm:col-span-2 lg:col-span-4 animate-pulse">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[...Array(3)].map((_, j) => (
                            <div key={j} className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-28"></div>
                                    <div className="h-6 bg-gray-300 rounded dark:bg-gray-600 w-24"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {/* Total Orders */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <ShoppingBag className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Orders</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.total_orders}</h4>
                    </div>
                    <Badge color="info">Total</Badge>
                </div>
            </div>

            {/* Pending Orders */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Clock className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Pending Orders</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.pending_orders}</h4>
                    </div>
                    <Badge color="warning">Pending</Badge>
                </div>
            </div>

            {/* Delivered Orders */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <CheckCircle className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Delivered Orders</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.delivered_orders}</h4>
                    </div>
                    <Badge color="success">Delivered</Badge>
                </div>
            </div>

            {/* Cancelled Orders */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <XCircle className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Cancelled Orders</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.cancelled_orders}</h4>
                    </div>
                    <Badge color="error">Cancelled</Badge>
                </div>
            </div>

            {/* Revenue & Activity Summary (Full-width) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 sm:col-span-2 lg:col-span-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* Total Revenue */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                            <DollarSign className="text-gray-800 size-6 dark:text-white/90" />
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</span>
                            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{formatAmount(metrics.total_revenue)}</h4>
                        </div>
                    </div>

                    {/* Average Order Value */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                            <TrendingUp className="text-gray-800 size-6 dark:text-white/90" />
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Avg. Order Value</span>
                            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{formatAmount(metrics.avg_order_value)}</h4>
                        </div>
                    </div>

                    {/* Orders in Last 7 Days */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                            <CalendarDays className="text-gray-800 size-6 dark:text-white/90" />
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Orders (Last 7 Days)</span>
                            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.orders_last_7_days.toLocaleString()}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

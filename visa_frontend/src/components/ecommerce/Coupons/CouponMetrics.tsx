import {useEffect, useState} from "react";
import {TicketPercent, CheckCircle, Timer, ClipboardList} from "lucide-react";
import Badge from "../../ui/badge/Badge";
import {getCouponMetrics} from "../../../services/couponService";
import type {CouponMetrics as CouponMetricsType} from "../../../services/couponService";
import axios from "axios";

export default function CouponMetrics({refreshKey = 0}: { refreshKey?: number }) {
    const [metrics, setMetrics] = useState<CouponMetricsType | null>(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token") || "";

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const data = await getCouponMetrics(token);
                setMetrics(data);
            } catch (error: unknown) {
                console.error("Failed to fetch coupon metrics:", error);
                if (axios.isAxiosError(error)) {
                    const message = (error.response?.data as { detail?: string } | undefined)?.detail ||
                        "Failed to load coupon metrics.";
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
            {/* Total Coupons */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <TicketPercent className="text-gray-800 size-6 dark:text-white/90" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Coupons</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.total_coupons}</h4>
                    </div>
                    <Badge color="info">Total</Badge>
                </div>
            </div>

            {/* Active Coupons */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <CheckCircle className="text-gray-800 size-6 dark:text-white/90" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Active Coupons</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.active_coupons}</h4>
                    </div>
                    <Badge color="success">Active</Badge>
                </div>
            </div>

            {/* Expired Coupons */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Timer className="text-gray-800 size-6 dark:text-white/90" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Expired Coupons</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.expired_coupons}</h4>
                    </div>
                    <Badge color="warning">Expired</Badge>
                </div>
            </div>

            {/* Total Redemptions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <ClipboardList className="text-gray-800 size-6 dark:text-white/90" />
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Redemptions</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.total_redemptions}</h4>
                    </div>
                    <Badge color="info">Used</Badge>
                </div>
            </div>
        </div>
    );
}

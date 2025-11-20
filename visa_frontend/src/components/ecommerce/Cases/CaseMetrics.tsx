import {useEffect, useState} from "react";
import axios from "axios";
import Badge from "../../ui/badge/Badge.tsx";
import {getSupportMetrics, type SupportMetrics} from "../../../services/caseService";
import {FolderKanban, AlertCircle, Timer, CheckCircle2, CalendarDays} from "lucide-react";

export default function CaseMetrics({refreshKey = 0}: { refreshKey?: number }) {
    const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token") || "";

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const data = await getSupportMetrics(token);
                setMetrics(data);
            } catch (error: unknown) {
                console.error("Failed to fetch support metrics:", error);
                if (axios.isAxiosError(error)) {
                    const message = (error.response?.data as { detail?: string } | undefined)?.detail ||
                        "Failed to load support metrics.";
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
                    <div key={i}
                         className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"/>
                        <div className="mt-5 space-y-2">
                            <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-2/3"/>
                            <div className="h-6 bg-gray-300 rounded dark:bg-gray-600 w-1/2"/>
                        </div>
                    </div>
                ))}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 sm:col-span-2 lg:col-span-4 animate-pulse">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[...Array(2)].map((_, j) => (
                            <div key={j} className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"/>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-28"/>
                                    <div className="h-6 bg-gray-300 rounded dark:bg-gray-600 w-24"/>
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
            {/* Total Cases */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <FolderKanban className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Cases</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.total_cases}</h4>
                    </div>
                    <Badge color="info">Total</Badge>
                </div>
            </div>

            {/* Open Cases */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <AlertCircle className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Open Cases</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.open_cases}</h4>
                    </div>
                    <Badge color="warning">Open</Badge>
                </div>
            </div>

            {/* In Progress */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Timer className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">In Progress</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.in_progress_cases}</h4>
                    </div>
                    <Badge color="info">In Progress</Badge>
                </div>
            </div>

            {/* Closed Cases */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <CheckCircle2 className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Closed Cases</span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.closed_cases}</h4>
                    </div>
                    <Badge color="success">Closed</Badge>
                </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 sm:col-span-2 lg:col-span-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Last 7 Days */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                            <CalendarDays className="text-gray-800 size-6 dark:text-white/90"/>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Cases (Last 7 Days)</span>
                            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.cases_last_7_days.toLocaleString()}</h4>
                        </div>
                    </div>

                    {/* Avg Response Time */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                            <Timer className="text-gray-800 size-6 dark:text-white/90"/>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Response Time</span>
                            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{metrics.avg_response_time_hours.toLocaleString()}h</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

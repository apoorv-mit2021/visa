import {useEffect, useState} from "react";
import {getStaffMetrics, StaffMetrics} from "../../../services/employeeService";
import {
    Users,
    UserCheck,
    ClipboardList,
    Gauge,
} from "lucide-react";
import Badge from "../../ui/badge/Badge";

export default function EmployeeMetrics({refreshKey = 0}: { refreshKey?: number }) {
    const [metrics, setMetrics] = useState<StaffMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token") || "";

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const data = await getStaffMetrics(token);
                setMetrics(data);
            } catch (err) {
                console.error("Failed to fetch staff metrics:", err);
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
            {/* Total Staff */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Users className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Staff
            </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {metrics.total_staff}
                        </h4>
                    </div>
                    <Badge color="success">Active</Badge>
                </div>
            </div>

            {/* Active Staff */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <UserCheck className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active Staff
            </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {metrics.active_staff}
                        </h4>
                    </div>
                    <Badge color="success">Now</Badge>
                </div>
            </div>

            {/* Open Cases */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <ClipboardList className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Open Cases
            </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {metrics.open_cases}
                        </h4>
                    </div>
                    <Badge color="error">Ongoing</Badge>
                </div>
            </div>

            {/* Avg Case Load */}
            <div
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                    <Gauge className="text-gray-800 size-6 dark:text-white/90"/>
                </div>
                <div className="flex items-end justify-between mt-5">
                    <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Avg. Case Load
            </span>
                        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                            {metrics.avg_case_load_per_staff}
                        </h4>
                    </div>
                    <Badge color="info">Per Staff</Badge>
                </div>
            </div>
        </div>
    );
}

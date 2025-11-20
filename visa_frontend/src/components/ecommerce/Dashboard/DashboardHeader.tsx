import {useAuth} from "../../../context/AuthContext";

export default function DashboardHeader() {
    const {user} = useAuth();
    const displayName = user?.full_name || user?.email || "there";

    return (
        <div
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Background image */}
            <div className="absolute inset-0 pointer-events-none">
                <img
                    src="/images/grid-image/image-01.png"
                    alt="Abstract background"
                    className="h-full w-full object-cover opacity-30 dark:opacity-20"
                />
                {/* subtle gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-transparent dark:from-gray-950/70"/>
            </div>

            {/* Content */}
            <div className="relative p-6 md:p-8">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    Welcome back, {displayName}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Stay on top of application statuses, document checks, and team performance.
                </p>
            </div>
        </div>
    );
}

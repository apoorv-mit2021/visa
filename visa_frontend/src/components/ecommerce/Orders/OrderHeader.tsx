import {RefreshCw} from "lucide-react";

type OrderHeaderProps = {
    onRefresh: () => void;
};

export default function OrderHeader({onRefresh}: OrderHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    Order Management
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Manage your orders and their performance
                </p>
            </div>
            <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                <RefreshCw className="w-4 h-4 mr-2"/>
                Refresh
            </button>
        </div>
    );
}

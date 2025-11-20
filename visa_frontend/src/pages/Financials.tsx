import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";

export default function Financials() {
    return (
        <>
            <PageMeta
                title="Financials | Auri Admin"
                description="Track revenue, expenses, cash flow, and key financial metrics in Auri Admin."
            />

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                {/* ======== LEFT COLUMN ======== */}
                <div className="col-span-12 xl:col-span-7 flex flex-col space-y-6">
                    {/* --- Financial Overview --- */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                            Financial Overview 123
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placeholder for KPI metrics cards (Revenue, Profit, Expenses, Cash
                            Flow)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                        </div>
                    </div>

                    <ComponentCard title="Financial Overview 123" desc="Placeholder for KPI metrics cards (Revenue, Profit, Expenses, Cash
                            Flow)">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                        </div>

                    </ComponentCard>


                    {/* --- Revenue vs Expenses Chart --- */}
                    <div className="flex flex-col flex-1 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                            Revenue vs Expenses
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placeholder for revenue vs expense trend chart
                        </p>
                        <div className="flex-1 h-72 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mt-4" />
                    </div>

                    {/* --- Recent Transactions --- */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                            Recent Transactions
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placeholder for transactions table (income & expenses)
                        </p>
                        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mt-4" />
                    </div>
                </div>

                {/* ======== RIGHT COLUMN ======== */}
                <div className="col-span-12 xl:col-span-5 flex flex-col space-y-6">
                    {/* --- Account Balances --- */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                            Account Balances
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placeholder for account balances summary
                        </p>
                        <div className="space-y-3 mt-4">
                            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                        </div>
                    </div>

                    {/* --- Expense Breakdown --- */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                            Expense Breakdown
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placeholder for expense category pie chart
                        </p>
                        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mt-4" />
                    </div>

                    {/* --- Profit & Loss Summary --- */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                            Profit & Loss Summary
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placeholder for P&L overview card
                        </p>
                        <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mt-4" />
                    </div>
                </div>

                {/* ======== FULL WIDTH SECTION ======== */}
                <div className="col-span-12 space-y-6">
                    {/* --- Cash Flow Overview --- */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                            Cash Flow Overview
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placeholder for cash inflow vs outflow chart
                        </p>
                        <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mt-4" />
                    </div>

                    {/* --- Budget vs Actual --- */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                            Budget vs Actual
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Placeholder for budget comparison table
                        </p>
                        <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mt-4" />
                    </div>
                </div>
            </div>
        </>
    );
}

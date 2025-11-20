import EcommerceMetrics from "../components/ecommerce/Dashboard/EcommerceMetrics.tsx";
import MonthlySalesChart from "../components/ecommerce/Dashboard/MonthlySalesChart.tsx";
import StatisticsChart from "../components/ecommerce/Dashboard/StatisticsChart.tsx";
import MonthlyTarget from "../components/ecommerce/Dashboard/MonthlyTarget.tsx";
import RecentOrders from "../components/ecommerce/Dashboard/RecentOrders.tsx";
import LowStockProducts from "../components/ecommerce/Dashboard/LowStockProducts.tsx";
import PageMeta from "../components/common/PageMeta.tsx";
import DashboardHeader from "../components/ecommerce/Dashboard/DashboardHeader.tsx";

export default function Dashboard() {
    return (
        <>
            <PageMeta
                title="Dashboard | Auri Admin"
                description="Overview of key ecommerce metrics and recent activity in Auri Admin."
            />
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12">
                    <DashboardHeader />
                </div>

                <div className="col-span-12 space-y-6 xl:col-span-7">
                    <EcommerceMetrics/>
                    <MonthlySalesChart/>
                </div>

                <div className="col-span-12 xl:col-span-5">
                    <MonthlyTarget/>
                </div>

                <div className="col-span-12 xl:col-span-7">
                    <RecentOrders/>
                </div>

                <div className="col-span-12 xl:col-span-5">
                    <LowStockProducts/>
                </div>

                <div className="col-span-12">
                    <StatisticsChart/>
                </div>

            </div>
        </>
    );
}

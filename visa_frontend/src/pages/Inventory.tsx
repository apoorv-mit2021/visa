import {useState} from "react";
import PageMeta from "../components/common/PageMeta";
import InventoryMetrics from "../components/ecommerce/Inventory/InventoryMetrics.tsx";
import LowStockTable from "../components/ecommerce/Inventory/LowStockTable.tsx";
import RecentInventoryMovements from "../components/ecommerce/Inventory/RecentInventoryMovements.tsx";
import InventoryHeader from "../components/ecommerce/Inventory/InventoryHeader.tsx";

export default function Inventory() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    return (
        <>
            <PageMeta
                title="Inventory | Auri Admin"
                description="Manage inventory, view performance metrics, and assign tasks in Auri Admin."
            />

            <div className="mb-6">
                <InventoryHeader onRefresh={handleRefresh}/>
            </div>

            <div className="grid grid-cols-12 gap-4 md:gap-6 items-stretch">
                <div className="col-span-12 space-y-6">
                    <InventoryMetrics refreshKey={refreshKey}/>
                </div>
                <div className="col-span-12 xl:col-span-12">
                    <LowStockTable key={refreshKey}/>
                </div>
                <div className="col-span-12 xl:col-span-12">
                    <RecentInventoryMovements key={refreshKey}/>
                </div>
            </div>
        </>
    );
}

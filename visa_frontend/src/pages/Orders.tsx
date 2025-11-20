import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import OrderMetrics from "../components/ecommerce/Orders/OrderMetrics";
import OrderTable from "../components/ecommerce/Orders/OrderTable.tsx";
import OrderHeader from "../components/ecommerce/Orders/OrderHeader.tsx";
import OrderSlideOver from "../components/ecommerce/Orders/OrderSlideOver";
import type { Order } from "../services/orderService";
import {useModal} from "../hooks/useModal";

export default function Orders() {
    const [refreshKey, setRefreshKey] = useState(0);
    const {isOpen, openModal, closeModal} = useModal(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    const handleView = (order: Order) => {
        setSelectedOrder(order);
        openModal();
    };

    return (
        <>
            <PageMeta
                title="Orders | Auri Admin"
                description="Manage orders, view performance metrics, and assign tasks in Auri Admin."
            />

            <div className="mb-6">
                <OrderHeader onRefresh={handleRefresh} />
            </div>

            <OrderSlideOver isOpen={isOpen} onClose={closeModal} order={selectedOrder || undefined} />

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6">
                    <OrderMetrics refreshKey={refreshKey} />
                </div>

                <div className="col-span-12 space-y-6">
                    <OrderTable key={refreshKey} onView={handleView} />
                </div>

            </div>
        </>
    );
}

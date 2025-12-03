import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import OrderMetrics from "../components/ecommerce/Orders/OrderMetrics";
import OrderTable from "../components/ecommerce/Orders/OrderTable";
import OrderHeader from "../components/ecommerce/Orders/OrderHeader";
import { Slider } from "../components/common/Slider";
import type { Order } from "../services/orderService";
import type { Customer } from "../services/customerService";
import { updateOrderStatus } from "../services/orderService";
import { useModal } from "../hooks/useModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import axios from "axios";
import OrderForm, { type OrderMode } from "../components/ecommerce/Orders/OrderForm";
import CustomerForm from "../components/ecommerce/Customers/CustomerForm";

export default function Orders() {
    const [refreshKey, setRefreshKey] = useState(0);
    const {isOpen, openModal, closeModal} = useModal(false);
    const {isOpen: isCustomerOpen, openModal: openCustomerModal, closeModal: closeCustomerModal} = useModal(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [mode, setMode] = useState<OrderMode>("view");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useAuth();

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    const handleView = (order: Order) => {
        setMode("view");
        setSelectedOrder(order);
        openModal();
    };

    const handleEdit = (order: Order) => {
        setMode("edit");
        setSelectedOrder(order);
        openModal();
    };

    const handleViewCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        openCustomerModal();
    };

    const handleSubmit = async (data: { id: number; status: string }) => {
        if (!token) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }
        try {
            setIsSubmitting(true);
            await updateOrderStatus(token, data.id, data.status);
            toast.success("Order updated!");
            closeModal();
            handleRefresh();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error((error.response?.data as any)?.detail || "Request failed");
            } else {
                toast.error("Unexpected error");
            }
        } finally {
            setIsSubmitting(false);
        }
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

            <Slider
                isOpen={isOpen}
                onClose={() => {
                    setMode("view");
                    closeModal();
                }}
                title={mode === "edit" ? "Edit Order" : "Order Details"}
            >
                <OrderForm
                    mode={mode}
                    order={selectedOrder || undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onModeChange={setMode}
                />
            </Slider>

            {/* Customer View Slider */}
            <Slider
                isOpen={isCustomerOpen}
                onClose={() => {
                    closeCustomerModal();
                    setSelectedCustomer(null);
                }}
                title="Customer Details"
            >
                <CustomerForm
                    customer={selectedCustomer || undefined}
                    onUpdated={() => {
                        // Close the customer slider; optionally refresh orders view
                        closeCustomerModal();
                        setSelectedCustomer(null);
                        handleRefresh();
                    }}
                />
            </Slider>

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6">
                    <OrderMetrics refreshKey={refreshKey} />
                </div>

                <div className="col-span-12 space-y-6">
                    <OrderTable key={refreshKey} onView={handleView} onEdit={handleEdit} onViewCustomer={handleViewCustomer} />
                </div>

            </div>
        </>
    );
}

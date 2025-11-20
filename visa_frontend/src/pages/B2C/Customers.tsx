import {useState} from "react";
import PageMeta from "../../components/common/PageMeta";
import CustomerMetrics from "../../components/ecommerce/Customers/CustomerMetrics";
import CustomerTable from "../../components/ecommerce/Customers/CustomerTable";
import CustomerHeader from "../../components/ecommerce/Customers/CustomerHeader.tsx";
import {useModal} from "../../hooks/useModal.ts";
import {Slider} from "../../components/common/Slider";
import CustomerForm from "../../components/ecommerce/Customers/CustomerForm.tsx";
import {useAuth} from "../../context/AuthContext";
import {toast} from "sonner";
import axios from "axios";
import {getCustomer, type Customer} from "../../services/customerService";

export default function Customers() {
    const [refreshKey, setRefreshKey] = useState(0);
    const {isOpen, openModal, closeModal} = useModal(false);
    const {token} = useAuth();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    const handleView = async (customer: Customer) => {
        if (!token) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }
        setIsLoading(true);
        setSelectedCustomer(null);
        openModal();
        try {
            const fullCustomer = await getCustomer(token, customer.id);
            setSelectedCustomer(fullCustomer);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const message = (error.response?.data as { detail?: string })?.detail || "Failed to fetch customer.";
                toast.error(message);
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageMeta
                title="Customers | Auri Admin"
                description="Manage customers, view performance metrics, and assign tasks in Auri Admin."
            />

            <div className="mb-6">
                <CustomerHeader onRefresh={handleRefresh}/>
            </div>

            <Slider isOpen={isOpen} onClose={closeModal} title="Customer Details">
                <CustomerForm customer={selectedCustomer || undefined} isLoading={isLoading}/>
            </Slider>

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6 ">
                    <CustomerMetrics refreshKey={refreshKey}/>
                </div>
                <div className="col-span-12 space-y-6 ">
                    <CustomerTable refreshKey={refreshKey} onView={handleView}/>
                </div>
            </div>
        </>
    );
}

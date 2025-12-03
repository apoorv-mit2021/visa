import EcommerceMetrics from "../components/ecommerce/Dashboard/EcommerceMetrics.tsx";
import MonthlySalesChart from "../components/ecommerce/Dashboard/MonthlySalesChart.tsx";
import StatisticsChart from "../components/ecommerce/Dashboard/StatisticsChart.tsx";
// import MonthlyTarget from "../components/ecommerce/Dashboard/MonthlyTarget.tsx";
import RecentOrders from "../components/ecommerce/Dashboard/RecentOrders.tsx";
import LowStockProducts from "../components/ecommerce/Dashboard/LowStockProducts.tsx";
import PageMeta from "../components/common/PageMeta.tsx";
import DashboardHeader from "../components/ecommerce/Dashboard/DashboardHeader.tsx";
import RecentCases from "../components/ecommerce/Dashboard/RecentCases.tsx";
import { Slider } from "../components/common/Slider";
import CaseForm, { type CaseMode } from "../components/ecommerce/Cases/CaseForm";
import { useState } from "react";
import { useModal } from "../hooks/useModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import axios from "axios";
import {
  createSupportCase,
  updateSupportCase,
  type SupportCase,
  type SupportCaseCreate,
  type SupportCaseUpdate,
} from "../services/caseService";

export default function Dashboard() {
    // Local state to open CaseForm from RecentCases actions
    const { isOpen, openModal, closeModal } = useModal(false);
    const { token } = useAuth();
    const [mode, setMode] = useState<CaseMode>("view");
    const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleView = (c: SupportCase) => {
        setMode("view");
        setSelectedCase(c);
        openModal();
    };

    const handleEdit = (c: SupportCase) => {
        setMode("edit");
        setSelectedCase(c);
        openModal();
    };

    const handleSubmit = async (
        data: SupportCaseCreate | { id: number; data: SupportCaseUpdate }
    ) => {
        if (!token) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }

        try {
            setIsSubmitting(true);
            if (mode === "create") {
                const payload = data as SupportCaseCreate;
                await createSupportCase(token, payload);
                toast.success("Case created!");
            } else {
                const payload = data as { id: number; data: SupportCaseUpdate };
                await updateSupportCase(token, payload.id, payload.data);
                toast.success("Case updated!");
            }
            closeModal();
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
                title="Dashboard | Auri Admin"
                description="Overview of key ecommerce metrics and recent activity in Auri Admin."
            />
            <Slider
                isOpen={isOpen}
                onClose={closeModal}
                title={
                    mode === "create"
                        ? "Create Case"
                        : mode === "edit"
                            ? "Edit Case"
                            : "Case Details"
                }
                maxWidthClass="max-w-4xl"
            >
                <CaseForm
                    mode={mode}
                    supportCase={selectedCase || undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onModeChange={(m) => setMode(m)}
                />
            </Slider>
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12">
                    <DashboardHeader/>
                </div>

                <div className="col-span-12 space-y-6 xl:col-span-7">
                    <EcommerceMetrics/>
                    <MonthlySalesChart/>
                </div>

                <div className="col-span-12 xl:col-span-5">
                    {/*<MonthlyTarget/>*/}
                    <RecentCases onView={handleView} onEdit={handleEdit} />
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

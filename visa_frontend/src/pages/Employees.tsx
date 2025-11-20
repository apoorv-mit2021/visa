import { useState } from "react";
import { useModal } from "../hooks/useModal";
import { useAuth } from "../context/AuthContext";
import PageMeta from "../components/common/PageMeta";
import { Slider } from "../components/common/Slider";
import EmployeeHeader from "../components/ecommerce/Employees/EmployeeHeader";
import EmployeeMetrics from "../components/ecommerce/Employees/EmployeeMetrics.tsx";
import EmployeeTable from "../components/ecommerce/Employees/EmployeeTable.tsx";
import EmployeeForm, { type EmployeeFormMode } from "../components/ecommerce/Employees/EmployeeForm";
import {
    createStaff,
    updateStaff,
    type Staff,
    type CreateStaffRequest,
    type UpdateStaffRequest,
} from "../services/employeeService";
import { toast } from "sonner";
import axios from "axios";

export default function Employees() {
    const { isOpen, openModal, closeModal } = useModal(false);
    const { token } = useAuth();

    const [mode, setMode] = useState<EmployeeFormMode>("create");
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    const openCreate = () => {
        setMode("create");
        setSelectedStaff(null);
        openModal();
    };

    const handleView = (staff: Staff) => {
        setSelectedStaff(staff);
        setMode("view");
        openModal();
    };

    const handleEdit = (staff: Staff) => {
        setSelectedStaff(staff);
        setMode("edit");
        openModal();
    };

    const handleSubmit = async (
        data: CreateStaffRequest | { id: number; data: UpdateStaffRequest }
    ) => {
        if (!token) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }

        try {
            setIsSubmitting(true);

            if (mode === "create") {
                await createStaff(token, data as CreateStaffRequest);
                toast.success("Employee created successfully!");
            } else {
                const { id, data: updateData } = data as {
                    id: number;
                    data: UpdateStaffRequest;
                };
                await updateStaff(token, id, updateData);
                toast.success("Employee updated successfully!");
            }

            closeModal();
            handleRefresh();
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const message =
                    (error.response?.data as { detail?: string })?.detail ||
                    "Request failed";
                toast.error(message);
            } else {
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <PageMeta
                title="Employees | Auri Admin"
                description="Manage employees, view performance metrics, and assign tasks in Auri Admin."
            />

            <div className="mb-6">
                <EmployeeHeader onAddEmployee={openCreate} onRefresh={handleRefresh} />
            </div>

            <Slider
                isOpen={isOpen}
                onClose={closeModal}
                title={
                    mode === "create"
                        ? "Create Employee"
                        : mode === "edit"
                            ? "Edit Employee"
                            : "Employee Details"
                }
            >
                <EmployeeForm
                    mode={mode}
                    staff={selectedStaff || undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                />
            </Slider>

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6">
                    <EmployeeMetrics refreshKey={refreshKey} />
                </div>
                <div className="col-span-12">
                    <EmployeeTable
                        refreshKey={refreshKey}
                        onView={handleView}
                        onEdit={handleEdit}
                    />
                </div>
            </div>
        </>
    );
}

import {useState} from "react";
import PageMeta from "../components/common/PageMeta";
import CaseHeader from "../components/ecommerce/Cases/CaseHeader.tsx";
import CaseMetrics from "../components/ecommerce/Cases/CaseMetrics.tsx";
import CaseTable from "../components/ecommerce/Cases/CaseTable.tsx";
import {Slider} from "../components/common/Slider";
import CaseForm, { type CaseMode } from "../components/ecommerce/Cases/CaseForm";
import {useModal} from "../hooks/useModal";
import {useAuth} from "../context/AuthContext";
import {toast} from "sonner";
import axios from "axios";
import {
    createSupportCase,
    updateSupportCase,
    type SupportCase,
    type SupportCaseUpdate,
    type SupportCaseCreate,
} from "../services/caseService";

export default function Cases() {
    const {isOpen, openModal, closeModal} = useModal(false);
    const {token} = useAuth();
    const [mode, setMode] = useState<CaseMode>("create");
    const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    const openCreate = () => {
        setMode("create");
        setSelectedCase(null);
        openModal();
    };

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
                title="Cases | Auri Admin"
                description="Manage cases, view performance metrics, and assign them to customers in Auri Admin."
            />

            <div className="mb-6">
                <CaseHeader onAddCase={openCreate} onRefresh={handleRefresh}/>
            </div>

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
                <div className="col-span-12 space-y-6">
                    <CaseMetrics refreshKey={refreshKey}/>
                </div>
                <div className="col-span-12">
                    <CaseTable refreshKey={refreshKey} onView={handleView} onEdit={handleEdit} />
                </div>
            </div>
        </>
    );
}

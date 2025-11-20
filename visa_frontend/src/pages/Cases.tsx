import {useState} from "react";
import {useModal} from "../hooks/useModal.ts";
import PageMeta from "../components/common/PageMeta";
import CaseHeader from "../components/ecommerce/Cases/CaseHeader.tsx";
import CaseMetrics from "../components/ecommerce/Cases/CaseMetrics.tsx";
import CaseTable from "../components/ecommerce/Cases/CaseTable.tsx";
import AddCaseSlideOver from "../components/ecommerce/Cases/AddCaseSlideOver.tsx";

export default function Cases() {
    const {isOpen, openModal, closeModal} = useModal(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    return (
        <>
            <PageMeta
                title="Cases | Auri Admin"
                description="Manage cases, view performance metrics, and assign them to customers in Auri Admin."
            />

            <div className="mb-6">
                <CaseHeader onAddCase={openModal} onRefresh={handleRefresh} />
            </div>

            <AddCaseSlideOver
                isOpen={isOpen}
                onClose={closeModal}
                onCreate={(data) => {
                    console.log("Create employee:", data);
                }}
            />

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6">
                    <CaseMetrics refreshKey={refreshKey} />
                </div>
                <div className="col-span-12">
                    <CaseTable refreshKey={refreshKey} />
                </div>
            </div>
        </>
    );
}

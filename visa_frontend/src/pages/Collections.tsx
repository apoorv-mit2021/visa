// src/pages/Collections.tsx

import {useState} from "react";
import PageMeta from "../components/common/PageMeta";
import CollectionMetrics from "../components/ecommerce/Collections/CollectionMetrics";
import CollectionTable from "../components/ecommerce/Collections/CollectionTable";
import CollectionHeader from "../components/ecommerce/Collections/CollectionHeader";
import {Slider} from "../components/common/Slider";
import CollectionForm, {
    type CollectionMode,
} from "../components/ecommerce/Collections/CollectionForm";

import {toast} from "sonner";
import axios from "axios";

import {
    createCollection,
    updateCollection,
    type Collection,
} from "../services/collectionService";

import {useModal} from "../hooks/useModal";
import {useAuth} from "../context/AuthContext";

export default function Collections() {
    const {isOpen, openModal, closeModal} = useModal(false);
    const {token} = useAuth();

    const [mode, setMode] = useState<CollectionMode>("create");
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    // Open handlers
    const openCreate = () => {
        setMode("create");
        setSelectedCollection(null);
        openModal();
    };

    const handleView = (collection: Collection) => {
        setMode("view");
        setSelectedCollection(collection);
        openModal();
    };

    const handleEdit = (collection: Collection) => {
        setMode("edit");
        setSelectedCollection(collection);
        openModal();
    };

    // Submit handler
    const handleSubmit = async (
        data:
            | { name: string; description?: string; is_active?: boolean; product_ids?: number[] }
            | { id: number; data: any }
    ) => {
        if (!token) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }

        try {
            setIsSubmitting(true);

            if (mode === "create") {
                const payload = data as { name: string; description?: string; is_active?: boolean; product_ids?: number[] };
                await createCollection(token, payload);
                toast.success("Collection created!");
            } else {
                const payload = data as { id: number; data: any };
                await updateCollection(token, payload.id, payload.data);
                toast.success("Collection updated!");
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
                title="Collections | Auri Admin"
                description="Browse and manage product collections."
            />

            {/* Header */}
            <div className="mb-6">
                <CollectionHeader onAddCollection={openCreate} onRefresh={handleRefresh}/>
            </div>

            {/* Slider with CollectionForm */}
            <Slider
                isOpen={isOpen}
                onClose={closeModal}
                title={
                    mode === "create"
                        ? "Create Collection"
                        : mode === "edit"
                            ? "Edit Collection"
                            : "Collection Details"
                }
            >
                <CollectionForm
                    mode={mode}
                    collection={selectedCollection || undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                />
            </Slider>

            {/* Metrics + Table */}
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12">
                    <CollectionMetrics refreshKey={refreshKey}/>
                </div>
                <div className="col-span-12">
                    <CollectionTable
                        refreshKey={refreshKey}
                        onView={handleView}
                        onEdit={handleEdit}
                    />
                </div>
            </div>
        </>
    );
}

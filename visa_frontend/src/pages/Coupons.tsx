// src/pages/Coupons.tsx

import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import CouponHeader from "../components/ecommerce/Coupons/CouponHeader";
import CouponMetrics from "../components/ecommerce/Coupons/CouponMetrics";
import CouponTable from "../components/ecommerce/Coupons/CouponTable";
import { Slider } from "../components/common/Slider";
import CouponForm, { type CouponMode } from "../components/ecommerce/Coupons/CouponForm";

import { toast } from "sonner";
import axios from "axios";

import {
    createCoupon,
    updateCoupon,
    getCoupon,
    type Coupon,
    type CreateCouponRequest,
    type UpdateCouponRequest,
} from "../services/couponService";

import { useModal } from "../hooks/useModal";
import { useAuth } from "../context/AuthContext";

export default function Coupons() {
    const { isOpen, openModal, closeModal } = useModal(false);
    const { token } = useAuth();

    const [mode, setMode] = useState<CouponMode>("create");
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    // -----------------------------------
    // Open Handlers
    // -----------------------------------
    const openCreate = () => {
        setMode("create");
        setSelectedCoupon(null);
        openModal();
    };

    const handleView = async (couponId: number) => {
        if (!token) return;
        try {
            const coupon = await getCoupon(token, couponId);
            setSelectedCoupon(coupon);
            setMode("view");
            openModal();
        } catch (e) {
            toast.error("Failed to fetch coupon.");
        }
    };

    const handleEdit = async (couponId: number) => {
        if (!token) return;
        try {
            const coupon = await getCoupon(token, couponId);
            setSelectedCoupon(coupon);
            setMode("edit");
            openModal();
        } catch (e) {
            toast.error("Failed to fetch coupon for editing.");
        }
    };

    // -----------------------------------
    // Unified Submit Handler
    // -----------------------------------
    const handleSubmit = async (
        data: CreateCouponRequest | { id: number; data: UpdateCouponRequest }
    ) => {
        if (!token) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }

        try {
            setIsSubmitting(true);

            if (mode === "create") {
                await createCoupon(token, data as CreateCouponRequest);
                toast.success("Coupon created successfully!");
            } else {
                const { id, data: updateData } = data as {
                    id: number;
                    data: UpdateCouponRequest;
                };
                await updateCoupon(token, id, updateData);
                toast.success("Coupon updated successfully!");
            }

            closeModal();
            handleRefresh();

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const msg =
                    (error.response?.data as { detail?: string })?.detail ||
                    "Request failed";
                toast.error(msg);
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
                title="Coupons | Auri Admin"
                description="Manage coupons, view performance metrics, and assign them to customers."
            />

            {/* Header */}
            <div className="mb-6">
                <CouponHeader onAddCoupon={openCreate} onRefresh={handleRefresh} />
            </div>

            {/* Unified Slider for Create / View / Edit */}
            <Slider
                isOpen={isOpen}
                onClose={closeModal}
                title={
                    mode === "create"
                        ? "Create Coupon"
                        : mode === "edit"
                            ? "Edit Coupon"
                            : "Coupon Details"
                }
            >
                <CouponForm
                    mode={mode}
                    coupon={selectedCoupon || undefined}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                />
            </Slider>

            {/* Metrics + Table */}
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6">
                    <CouponMetrics refreshKey={refreshKey} />
                </div>
                <div className="col-span-12">
                    <CouponTable
                        refreshKey={refreshKey}
                        onView={handleView}
                        onEdit={handleEdit}
                    />
                </div>
            </div>
        </>
    );
}

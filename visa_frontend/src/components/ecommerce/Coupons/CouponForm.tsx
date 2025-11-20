import {useEffect, useState, FormEvent} from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Switch from "../../../components/form/switch/Switch";

import type {
    Coupon,
    CreateCouponRequest,
    UpdateCouponRequest,
    DiscountType,
} from "../../../services/couponService";

export type CouponMode = "create" | "view" | "edit";

interface CouponFormProps {
    mode?: CouponMode;
    coupon?: Coupon;
    isSubmitting?: boolean;
    onSubmit: (
        data:
            | CreateCouponRequest
            | { id: number; data: UpdateCouponRequest }
    ) => void;
}

export default function CouponForm({
                                       mode = "create",
                                       coupon,
                                       isSubmitting = false,
                                       onSubmit,
                                   }: CouponFormProps) {
    // ---------------------------------------
    // FORM STATE
    // ---------------------------------------
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");

    const [discountType, setDiscountType] = useState<DiscountType>("percentage");

    const [discountValue, setDiscountValue] = useState<number | undefined>(
        undefined
    );

    const [fixedDiscounts, setFixedDiscounts] = useState<Record<string, number>>({});

    const [minOrderValue, setMinOrderValue] = useState<number | undefined>(
        undefined
    );

    const [maxDiscountAmount, setMaxDiscountAmount] = useState<
        number | undefined
    >(undefined);

    const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);

    const [startDate, setStartDate] = useState<string | undefined>(undefined);
    const [endDate, setEndDate] = useState<string | undefined>(undefined);

    const [isActive, setIsActive] = useState(true);
    const [isEditing, setIsEditing] = useState(mode === "edit");

    // ---------------------------------------
    // PREFILL FORM DATA
    // ---------------------------------------
    useEffect(() => {
        if (coupon && (mode === "view" || mode === "edit")) {
            setCode(coupon.code);
            setDescription(coupon.description || "");
            setDiscountType(coupon.discount_type);
            setDiscountValue(coupon.discount_value || undefined);
            setFixedDiscounts(coupon.fixed_discounts || {});
            setMinOrderValue(coupon.min_order_value || undefined);
            setMaxDiscountAmount(coupon.max_discount_amount || undefined);
            setUsageLimit(coupon.usage_limit || undefined);
            setStartDate(coupon.start_date || undefined);
            setEndDate(coupon.end_date || undefined);
            setIsActive(coupon.is_active);
            setIsEditing(mode === "edit");
        } else if (mode === "create") {
            setCode("");
            setDescription("");
            setDiscountType("percentage");
            setDiscountValue(undefined);
            setFixedDiscounts({});
            setMinOrderValue(undefined);
            setMaxDiscountAmount(undefined);
            setUsageLimit(undefined);
            setStartDate(undefined);
            setEndDate(undefined);
            setIsActive(true);
            setIsEditing(true);
        }
    }, [coupon, mode]);

    const inputsDisabled = mode !== "create" && !isEditing;

    // ---------------------------------------
    // HANDLE SUBMIT
    // ---------------------------------------
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (mode === "create") {
            const payload: CreateCouponRequest = {
                code,
                description,
                discount_type: discountType,
                discount_value: discountType === "percentage" ? discountValue : undefined,
                fixed_discounts: discountType === "fixed" ? fixedDiscounts : {},
                min_order_value: minOrderValue,
                max_discount_amount: maxDiscountAmount,
                usage_limit: usageLimit,
                start_date: startDate,
                end_date: endDate,
                is_active: isActive,
            };

            return onSubmit(payload);
        }

        if (isEditing && coupon) {
            const data: UpdateCouponRequest = {};

            if (code !== coupon.code) data.code = code;
            if (description !== coupon.description)
                data.description = description;

            if (discountType !== coupon.discount_type)
                data.discount_type = discountType;

            if (discountType === "percentage") {
                if (discountValue !== coupon.discount_value)
                    data.discount_value = discountValue;
            }

            if (discountType === "fixed") {
                if (JSON.stringify(fixedDiscounts) !== JSON.stringify(coupon.fixed_discounts)) {
                    data.fixed_discounts = fixedDiscounts;
                }
            }

            if (minOrderValue !== coupon.min_order_value)
                data.min_order_value = minOrderValue;

            if (maxDiscountAmount !== coupon.max_discount_amount)
                data.max_discount_amount = maxDiscountAmount;

            if (usageLimit !== coupon.usage_limit)
                data.usage_limit = usageLimit;

            if (startDate !== coupon.start_date) data.start_date = startDate;
            if (endDate !== coupon.end_date) data.end_date = endDate;

            if (isActive !== coupon.is_active) data.is_active = isActive;

            onSubmit({id: coupon.id, data});
        }
    };

    // ---------------------------------------
    // RENDER
    // ---------------------------------------
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="coupon-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* Code */}
                    <div>
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="SAVE20"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={inputsDisabled}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label>Description</Label>
                        <TextArea
                            rows={4}
                            value={description}
                            onChange={(value) => setDescription(value)}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* Discount Type */}
                    <div>
                        <Label>Discount Type</Label>
                        <select
                            value={discountType}
                            onChange={(e) =>
                                setDiscountType(e.target.value as DiscountType)
                            }
                            disabled={inputsDisabled}
                            className="w-full rounded-md border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-700 px-3 py-2"
                        >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>

                    {/* Percentage Discount */}
                    {discountType === "percentage" && (
                        <div>
                            <Label>Percentage Discount (%)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={100}
                                value={discountValue || ""}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                disabled={inputsDisabled}
                                placeholder="10"
                                required
                            />
                        </div>
                    )}

                    {/* Fixed Discount */}
                    {discountType === "fixed" && (
                        <div className="space-y-4">
                            <Label>Fixed Discount (per currency)</Label>

                            {["USD", "EUR", "INR"].map((currency) => (
                                <div key={currency}>
                                    <Label>{currency}</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={fixedDiscounts[currency] || ""}
                                        disabled={inputsDisabled}
                                        onChange={(e) =>
                                            setFixedDiscounts((prev) => ({
                                                ...prev,
                                                [currency]: Number(e.target.value),
                                            }))
                                        }
                                        placeholder="Amount"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Minimum Order */}
                    <div>
                        <Label>Minimum Order Value</Label>
                        <Input
                            type="number"
                            value={minOrderValue || ""}
                            onChange={(e) => setMinOrderValue(Number(e.target.value))}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* Maximum Discount Amount */}
                    <div>
                        <Label>Max Discount Amount</Label>
                        <Input
                            type="number"
                            value={maxDiscountAmount || ""}
                            onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* Usage Limit */}
                    <div>
                        <Label>Usage Limit</Label>
                        <Input
                            type="number"
                            value={usageLimit || ""}
                            onChange={(e) => setUsageLimit(Number(e.target.value))}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* Dates */}
                    <div>
                        <Label>Start Date</Label>
                        <Input
                            type="datetime-local"
                            value={startDate || ""}
                            onChange={(e) => setStartDate(e.target.value)}
                            disabled={inputsDisabled}
                        />
                    </div>

                    <div>
                        <Label>End Date</Label>
                        <Input
                            type="datetime-local"
                            value={endDate || ""}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* Status */}
                    {mode !== "create" && (
                        <div className="flex items-center justify-between">
                            <Label>Status</Label>
                            <Switch
                                label={isActive ? "Active" : "Inactive"}
                                checked={isActive}
                                onChange={(checked) => setIsActive(checked)}
                                disabled={!isEditing}
                            />
                        </div>
                    )}

                </form>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                {mode === "create" ? (
                    <>
                        <button
                            type="reset"
                            onClick={() => {
                                setCode("");
                                setDescription("");
                                setDiscountType("percentage");
                                setDiscountValue(undefined);
                                setFixedDiscounts({});
                                setMinOrderValue(undefined);
                                setMaxDiscountAmount(undefined);
                                setUsageLimit(undefined);
                                setStartDate(undefined);
                                setEndDate(undefined);
                                setIsActive(true);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            form="coupon-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                                isSubmitting
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "Creating..." : "Create Coupon"}
                        </button>
                    </>
                ) : !isEditing ? (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Edit
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                if (coupon) {
                                    setCode(coupon.code);
                                    setDescription(coupon.description || "");
                                    setDiscountType(coupon.discount_type);
                                    setDiscountValue(coupon.discount_value || undefined);
                                    setFixedDiscounts(coupon.fixed_discounts || {});
                                    setMinOrderValue(coupon.min_order_value || undefined);
                                    setMaxDiscountAmount(coupon.max_discount_amount || undefined);
                                    setUsageLimit(coupon.usage_limit || undefined);
                                    setStartDate(coupon.start_date || undefined);
                                    setEndDate(coupon.end_date || undefined);
                                    setIsActive(coupon.is_active);
                                }
                                setIsEditing(false);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="coupon-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                                isSubmitting
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "Updating..." : "Update"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

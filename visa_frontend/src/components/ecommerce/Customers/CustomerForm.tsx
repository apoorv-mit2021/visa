import {useEffect, useState, FormEvent} from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";

import type {Customer} from "../../../services/customerService.ts";
import {updateCustomerAdmin} from "../../../services/customerService.ts";
import {useAuth} from "../../../context/AuthContext";
import {toast} from "sonner";
import axios from "axios";

export type CustomerFormMode = "view";

export interface CustomerFormProps {
    customer?: Customer;
    isLoading?: boolean;
    // Called after a successful update to allow parent to close slider and refresh
    onUpdated?: (customer: Customer) => void;
}

/**
 * Customer form (view with limited edit)
 * Only is_active and is_verified are editable when switching to edit mode.
 */
export default function CustomerForm({
                                         customer,
                                         isLoading = false,
                                         onUpdated,
                                     }: CustomerFormProps) {

    // ---------------------------------------
    // LOCAL FORM STATE (read–only values)
    // ---------------------------------------
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [roles, setRoles] = useState<string[]>([]);
    const [createdAt, setCreatedAt] = useState("");
    const [updatedAt, setUpdatedAt] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { token } = useAuth();

    // ---------------------------------------
    // PREFILL FORM DATA
    // ---------------------------------------
    useEffect(() => {
        if (customer) {
            setFullName(customer.full_name);
            setEmail(customer.email);
            setIsActive(customer.is_active);
            setIsVerified(customer.is_verified);
            setRoles(customer.roles || []);
            setCreatedAt(customer.created_at);
            setUpdatedAt(customer.updated_at);
            setIsEditing(false);
        }
    }, [customer]);

    // Note: Only is_active and is_verified are editable in edit mode.
    // Other fields remain read-only at all times.

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!customer) return;
        if (!token) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }

        // Prepare payload with only changed fields
        const payload: { is_active?: boolean; is_verified?: boolean } = {};
        if (isActive !== customer.is_active) payload.is_active = isActive;
        if (isVerified !== customer.is_verified) payload.is_verified = isVerified;

        // If nothing changed, just exit edit mode
        if (Object.keys(payload).length === 0) {
            toast.info("No changes to update.");
            setIsEditing(false);
            return;
        }

        try {
            setIsSubmitting(true);
            const updated = await updateCustomerAdmin(token, customer.id, payload);
            // Reflect potentially updated fields
            setIsActive(updated.is_active);
            setIsVerified(updated.is_verified);
            setUpdatedAt(updated.updated_at);
            toast.success("Customer updated.");
            setIsEditing(false);
            // Notify parent so it can close the slider and refresh listings
            onUpdated?.(updated);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error((error.response?.data as any)?.detail || "Failed to update customer");
            } else {
                toast.error("Unexpected error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---------------------------------------
    // RENDER
    // ---------------------------------------
    if (isLoading) {
        return <div className="p-6 text-gray-500">Loading customer...</div>;
    }

    if (!customer) {
        return <div className="p-6 text-gray-500">Customer not found.</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* Full Name */}
                    <div>
                        <Label>Full Name</Label>
                        <Input
                            type="text"
                            value={fullName}
                            disabled
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            disabled
                        />
                    </div>

                    {/* Roles */}
                    <div>
                        <Label>Roles</Label>
                        <Input
                            type="text"
                            value={roles.join(", ")}
                            disabled
                        />
                    </div>

                    {/* Status: Active */}
                    <div className="flex items-center justify-between">
                        <Label>Active Status</Label>
                        <Switch
                            checked={isActive}
                            disabled={!isEditing}
                            onChange={(checked) => isEditing && setIsActive(checked)}
                            label={isActive ? "Active" : "Inactive"}
                        />
                    </div>

                    {/* Status: Verified */}
                    <div className="flex items-center justify-between">
                        <Label>Verified</Label>
                        <Switch
                            checked={isVerified}
                            disabled={!isEditing}
                            onChange={(checked) => isEditing && setIsVerified(checked)}
                            label={isVerified ? "Verified" : "Not Verified"}
                        />
                    </div>

                    {/* Created */}
                    <div>
                        <Label>Created At</Label>
                        <Input
                            type="text"
                            value={new Date(createdAt).toLocaleString()}
                            disabled
                        />
                    </div>

                    {/* Updated */}
                    <div>
                        <Label>Last Updated</Label>
                        <Input
                            type="text"
                            value={new Date(updatedAt).toLocaleString()}
                            disabled
                        />
                    </div>

                </form>
            </div>

            {/* FOOTER — edit controls (only is_active, is_verified) */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                {!isEditing ? (
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
                                if (customer) {
                                    setIsActive(customer.is_active);
                                    setIsVerified(customer.is_verified);
                                }
                                setIsEditing(false);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="customer-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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

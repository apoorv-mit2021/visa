import {useEffect, useState} from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";

import type {Customer} from "../../../services/customerService.ts";

export type CustomerFormMode = "view";

interface CustomerFormProps {
    customer?: Customer;
    isLoading?: boolean;
}

/**
 * View-only customer form
 */
export default function CustomerForm({
                                         customer,
                                         isLoading = false,
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
        }
    }, [customer]);

    const inputsDisabled = true; // Always read-only

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
                <div className="space-y-6">

                    {/* Full Name */}
                    <div>
                        <Label>Full Name</Label>
                        <Input
                            type="text"
                            value={fullName}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* Roles */}
                    <div>
                        <Label>Roles</Label>
                        <Input
                            type="text"
                            value={roles.join(", ")}
                            disabled={inputsDisabled}
                        />
                    </div>

                    {/* Status: Active */}
                    <div className="flex items-center justify-between">
                        <Label>Active Status</Label>
                        <Switch
                            checked={isActive}
                            disabled={true}
                            label={isActive ? "Active" : "Inactive"}
                        />
                    </div>

                    {/* Status: Verified */}
                    <div className="flex items-center justify-between">
                        <Label>Verified</Label>
                        <Switch
                            checked={isVerified}
                            disabled={true}
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

                </div>
            </div>

            {/* FOOTER — no actions because read-only */}
            <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800 text-right">
                <span className="text-gray-500 text-sm">
                    View only — no editing allowed
                </span>
            </div>
        </div>
    );
}

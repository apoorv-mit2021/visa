import {useEffect, useState, FormEvent} from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";

import type {
    Staff,
    CreateStaffRequest,
    UpdateStaffRequest,
} from "../../../services/employeeService";

export type EmployeeFormMode = "create" | "view" | "edit";

interface EmployeeFormProps {
    mode?: EmployeeFormMode;
    staff?: Staff;
    isSubmitting?: boolean;
    onSubmit: (
        data: CreateStaffRequest | { id: number; data: UpdateStaffRequest }
    ) => void;
}

export default function EmployeeForm({
                                         mode = "create",
                                         staff,
                                         isSubmitting = false,
                                         onSubmit,
                                     }: EmployeeFormProps) {
    // ---------------------------------------
    // FORM STATE
    // ---------------------------------------
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [isActive, setIsActive] = useState(true);
    const [isEditing, setIsEditing] = useState(mode === "edit");

    // ---------------------------------------
    // PREFILL DATA
    // ---------------------------------------
    useEffect(() => {
        if (staff && (mode === "view" || mode === "edit")) {
            setFullName(staff.full_name ?? "");
            setEmail(staff.email ?? "");
            setIsActive(staff.is_active);
            setIsEditing(mode === "edit");
        } else if (mode === "create") {
            setFullName("");
            setEmail("");
            setPassword("");
            setIsActive(true);
            setIsEditing(true);
        }
    }, [staff, mode]);

    const inputsDisabled = mode !== "create" && !isEditing;

    // ---------------------------------------
    // SUBMIT HANDLER
    // ---------------------------------------
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (mode === "create") {
            const payload: CreateStaffRequest = {
                full_name: fullName,
                email,
                password,
            };
            return onSubmit(payload);
        }

        if (isEditing && staff) {
            const data: UpdateStaffRequest = {};

            if (fullName !== staff.full_name) data.full_name = fullName;
            if (email !== staff.email) data.email = email;
            if (password.trim() !== "") data.password = password;
            if (isActive !== staff.is_active) data.is_active = isActive;

            onSubmit({id: staff.id, data});
        }
    };

    // ---------------------------------------
    // RENDER
    // ---------------------------------------
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* Full Name */}
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={inputsDisabled}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={inputsDisabled}
                            required
                        />
                    </div>

                    {/* Password */}
                    {mode === "create" || isEditing ? (
                        <div>
                            <Label htmlFor="password">
                                {mode === "create" ? "Password" : "New Password (optional)"}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={mode === "create" ? "Enter password" : "Leave blank to keep existing"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={inputsDisabled}
                                required={mode === "create"}
                            />
                        </div>
                    ) : null}

                    {/* Status Toggle */}
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

            {/* FOOTER BUTTONS */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">

                {/* CREATE MODE */}
                {mode === "create" ? (
                    <>
                        <button
                            type="reset"
                            onClick={() => {
                                setFullName("");
                                setEmail("");
                                setPassword("");
                                setIsActive(true);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            form="employee-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                                isSubmitting
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "Creating..." : "Create Staff"}
                        </button>
                    </>
                ) : !isEditing ? (
                    // VIEW MODE → SHOW EDIT BUTTON
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Edit
                    </button>
                ) : (
                    // EDIT MODE → SHOW CANCEL + UPDATE
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                if (staff) {
                                    setFullName(staff.full_name);
                                    setEmail(staff.email);
                                    setIsActive(staff.is_active);
                                    setPassword("");
                                }
                                setIsEditing(false);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="employee-form"
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

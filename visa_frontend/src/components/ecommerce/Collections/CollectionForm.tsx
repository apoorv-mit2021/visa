// src/components/collections/CollectionForm.tsx

import {useEffect, useState, FormEvent} from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Switch from "../../../components/form/switch/Switch";
import type {Collection, CollectionUpdate} from "../../../services/collectionService";

export type CollectionMode = "create" | "view" | "edit";

interface CollectionFormProps {
    mode?: CollectionMode;
    collection?: Collection;
    isSubmitting?: boolean;
    onSubmit: (
        data:
            | { name: string; description?: string; is_active?: boolean }
            | { id: number; data: CollectionUpdate }
    ) => void;
}

export default function CollectionForm({
                                           mode = "create",
                                           collection,
                                           isSubmitting = false,
                                           onSubmit,
                                       }: CollectionFormProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isEditing, setIsEditing] = useState(mode === "edit");

    // Prefill data
    useEffect(() => {
        if (collection && (mode === "view" || mode === "edit")) {
            setName(collection.name || "");
            setDescription(collection.description || "");
            setIsActive(Boolean(collection.is_active));
            setIsEditing(mode === "edit");
        } else if (mode === "create") {
            setName("");
            setDescription("");
            setIsActive(true);
            setIsEditing(true);
        }
    }, [collection, mode]);

    const inputsDisabled = mode !== "create" && !isEditing;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (mode === "create") {
            onSubmit({
                name,
                description: description || undefined,
                is_active: isActive,
            });
            return;
        }

        if (isEditing && collection) {
            const updateData: CollectionUpdate = {};
            if (name !== collection.name) updateData.name = name;
            if (description !== collection.description)
                updateData.description = description || undefined;
            if (isActive !== Boolean(collection.is_active))
                updateData.is_active = isActive;

            onSubmit({id: collection.id, data: updateData});
        }
    };

    return (
        <div className="flex flex-col h-full">

            <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="collection-form" onSubmit={handleSubmit} className="space-y-6">

                    {/* Name */}
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Country name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={inputsDisabled}
                            required
                        />
                    </div>

                    {/* Slug (READ-ONLY, VIEW ONLY) */}
                    {collection && mode !== "create" && (
                        <div>
                            <Label>Slug</Label>
                            <Input
                                type="text"
                                value={collection.slug}
                                disabled
                                className="bg-gray-100 dark:bg-gray-800"
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <TextArea
                            rows={5}
                            value={description}
                            onChange={(value) => setDescription(value)}
                            disabled={inputsDisabled}
                            placeholder="Optional description"
                        />
                    </div>

                    {/* Status toggle */}
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

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                {mode === "create" ? (
                    <>
                        <button
                            type="reset"
                            onClick={() => {
                                setName("");
                                setDescription("");
                                setIsActive(true);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            form="collection-form"
                            disabled={isSubmitting}
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "Creating..." : "Save"}
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
                                if (collection) {
                                    setName(collection.name);
                                    setDescription(collection.description || "");
                                    setIsActive(Boolean(collection.is_active));
                                }
                                setIsEditing(false);
                            }}
                            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            form="collection-form"
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

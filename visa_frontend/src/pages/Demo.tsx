import {useState} from "react";
import PageMeta from "../components/common/PageMeta";
import {
    listCollections,
    createCollection,
    updateCollection,
    deleteCollection,
} from "../services/collectionService";
import {useAuth} from "../context/AuthContext";

export default function Demo() {
    const {token, isAuthenticated, isLoading} = useAuth();
    const [lastCreatedId, setLastCreatedId] = useState<number | null>(null);

    // Handle loading or unauthenticated states
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-600 dark:text-gray-300">
                Loading authentication...
            </div>
        );
    }

    if (!isAuthenticated || !token) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-screen space-y-3 text-gray-700 dark:text-gray-300">
                <h1 className="text-xl font-semibold">🔒 Authentication Required</h1>
                <p>Please log in to test collection APIs.</p>
            </div>
        );
    }

    // -----------------------
    // CRUD Handlers
    // -----------------------

    const handleList = async () => {
        try {
            const collections = await listCollections(token);
            console.log("📦 Collections:", collections);
            alert(`Fetched ${collections.length} collections. Check console for details.`);
        } catch (error) {
            console.error("Error fetching collections:", error);
            alert("❌ Failed to list collections.");
        }
    };

    const handleCreate = async () => {
        try {
            const newCollection = await createCollection(token, {
                name: "Spring Sale",
                description: "Exclusive spring offers",
                product_ids: [1, 2, 3],
            });
            console.log("✅ Created:", newCollection);
            setLastCreatedId(newCollection.id);
            alert(`✅ Created collection "${newCollection.name}"`);
        } catch (error) {
            console.error("Error creating collection:", error);
            alert("❌ Failed to create collection.");
        }
    };

    const handleUpdate = async () => {
        if (!lastCreatedId) {
            alert("⚠️ Create a collection first to update it.");
            return;
        }

        try {
            const updated = await updateCollection(token, lastCreatedId, {
                description: "Updated description",
                is_active: false,
            });
            console.log("✏️ Updated:", updated);
            alert(`✏️ Updated collection "${updated.name}"`);
        } catch (error) {
            console.error("Error updating collection:", error);
            alert("❌ Failed to update collection.");
        }
    };

    const handleDelete = async () => {
        if (!lastCreatedId) {
            alert("⚠️ Create a collection first to delete it.");
            return;
        }

        try {
            await deleteCollection(token, lastCreatedId);
            console.log("🗑️ Deleted collection:", lastCreatedId);
            alert(`🗑️ Deleted collection ID ${lastCreatedId}`);
            setLastCreatedId(null);
        } catch (error) {
            console.error("Error deleting collection:", error);
            alert("❌ Failed to delete collection.");
        }
    };

    // -----------------------
    // UI
    // -----------------------

    return (
        <>
            <PageMeta title="Demo Page" description="CRUD Demo for Collections"/>

            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                    🧪 Collection API Demo
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={handleList}
                        className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition-all"
                    >
                        📋 List Collections
                    </button>

                    <button
                        onClick={handleCreate}
                        className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-all"
                    >
                        ➕ Create Collection
                    </button>

                    <button
                        onClick={handleUpdate}
                        disabled={!lastCreatedId}
                        className={`rounded-lg px-4 py-2 text-white transition-all ${
                            lastCreatedId
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : "bg-yellow-300 cursor-not-allowed"
                        }`}
                    >
                        ✏️ Update Collection
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={!lastCreatedId}
                        className={`rounded-lg px-4 py-2 text-white transition-all ${
                            lastCreatedId
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-red-300 cursor-not-allowed"
                        }`}
                    >
                        🗑️ Delete Collection
                    </button>
                </div>

                <div className="pt-4 text-sm text-gray-500 dark:text-gray-400">
                    <p>ℹ️ Note:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                        <li>Authenticated token is automatically used from context.</li>
                        <li>
                            The <strong>Update</strong> and <strong>Delete</strong> buttons are
                            enabled only after creating a collection in this session.
                        </li>
                        <li>All API responses are logged in the browser console.</li>
                    </ul>
                </div>
            </div>
        </>
    );
}

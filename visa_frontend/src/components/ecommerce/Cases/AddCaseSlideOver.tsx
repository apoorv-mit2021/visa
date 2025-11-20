import {FormEvent, useEffect, useState} from "react";

type AddCaseSlideOverProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreate?: (data: { name: string; email: string; role: string }) => void;
};

export default function AddCaseSlideOver({
                                                 isOpen,
                                                 onClose,
                                                 onCreate,
                                             }: AddCaseSlideOverProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        if (!isOpen) {
            setName("");
            setEmail("");
            setRole("");
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const html = document.documentElement;
            const prevHtmlOverflow = html.style.overflow;
            const prevBodyOverflow = document.body.style.overflow;
            html.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
            html.classList.add("modal-open");
            return () => {
                html.style.overflow = prevHtmlOverflow;
                document.body.style.overflow = prevBodyOverflow;
                html.classList.remove("modal-open");
            };
        }
    }, [isOpen]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        onCreate?.({name, email, role});
        onClose();
    };

    return (
        <div className={`fixed inset-x-0 top-16 bottom-0 z-40 overflow-hidden ${isOpen ? "" : "pointer-events-none"}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0"
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel Container */}
            <div className="absolute inset-y-0 right-0 flex max-w-full">
                {/* Sliding Panel */}
                <div
                    className={`w-screen bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out 
                                sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
                >
                    <div className="flex h-full flex-col">
                        {/* Header */}
                        <div
                            className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Create New Case
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Name
                                    </label>
                                    <input
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="jane@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Role
                                    </label>
                                    <input
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        placeholder="Product Manager"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submit}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

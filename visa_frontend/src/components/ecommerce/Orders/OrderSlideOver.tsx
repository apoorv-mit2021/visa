import {useEffect, useState} from "react";
import type {Order} from "../../../services/orderService";
import {getOrder} from "../../../services/orderService";

 type OrderSlideOverProps = {
    isOpen: boolean;
    onClose: () => void;
    order?: Order;
 };

 export default function OrderSlideOver({ isOpen, onClose, order }: OrderSlideOverProps) {
    const [details, setDetails] = useState<Order | undefined>(order);
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token") || "";

    // Prevent scroll when open
    useEffect(() => {
        if (!isOpen) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, [isOpen]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!isOpen || !order) return;
            try {
                setLoading(true);
                const data = await getOrder(token, order.id);
                setDetails(data);
            } catch (e) {
                // silently fail, keep minimal change
            } finally {
                setLoading(false);
            }
        };
        setDetails(order);
        fetchDetails();
    }, [isOpen, order, token]);

    return (
        <div className={`fixed inset-x-0 top-16 bottom-0 z-40 overflow-hidden ${isOpen ? "" : "pointer-events-none"}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div className="absolute inset-y-0 right-0 flex max-w-full">
                <div
                    className={`w-screen bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out sm:max-w-md md:max-w-lg lg:max-w-xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
                >
                    <div className="flex h-full flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Details</h2>
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
                            {loading ? (
                                <div className="animate-pulse space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                                </div>
                            ) : details ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">#{details.id}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{details.status || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{(details.total_amount ?? 0).toLocaleString(undefined, {style: "currency", currency: "USD"})}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(details.created_at).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(details.updated_at).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {details.items && details.items.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Items</p>
                                            <div className="space-y-2">
                                                {details.items.map((it) => (
                                                    <div key={it.id} className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2">
                                                        <div className="text-sm text-gray-800 dark:text-gray-200">
                                                            {it.product_name} × {it.quantity}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {(it.price * it.quantity).toLocaleString(undefined, {style: "currency", currency: "USD"})}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {details.shipping_address && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Shipping Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{details.shipping_address}</p>
                                        </div>
                                    )}
                                    {details.billing_address && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Billing Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{details.billing_address}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400">No order selected.</div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
 }
import { useEffect, useMemo, useState } from "react";
import type { Order } from "../../../services/orderService";
import { getOrder, ORDER_STATUS_OPTIONS } from "../../../services/orderService";
import { useAuth } from "../../../context/AuthContext";

export type OrderMode = "view" | "edit";

type OrderFormProps = {
  mode: OrderMode;
  order?: Order;
  isSubmitting?: boolean;
  onSubmit: (payload: { id: number; status: string }) => void;
  onModeChange?: (mode: OrderMode) => void;
};

export default function OrderForm({
  mode,
  order,
  isSubmitting = false,
  onSubmit,
  onModeChange,
}: OrderFormProps) {
  const { token } = useAuth();
  const [details, setDetails] = useState<Order | undefined>(order);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(order?.status ?? "");

  // Fetch full order details when opened to ensure we have items, etc.
  useEffect(() => {
    let ignore = false;
    const fetchDetails = async () => {
      if (!order?.id || !token) {
        setDetails(order);
        return;
      }
      try {
        setLoading(true);
        const data = await getOrder(token, order.id);
        if (!ignore) setDetails(data);
      } catch {
        // noop minimal error handling
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    setDetails(order);
    setStatus(order?.status ?? "");
    fetchDetails();
    return () => {
      ignore = true;
    };
  }, [order, token]);

  // Derived helpers
  const currencyTotal = useMemo(() =>
    (details?.total_amount ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" }),
  [details?.total_amount]);

  if (!order) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">No order selected.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Order</p>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">#{order.id}</h3>
        </div>
        <div className="flex items-center gap-2">
          {mode === "view" ? (
            <button
              type="button"
              onClick={() => onModeChange?.("edit")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onModeChange?.("view")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSubmit({ id: order.id, status: status || order.status })}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
          {mode === "edit" ? (
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{details?.status || "—"}</div>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{currencyTotal}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-xs text-gray-500 dark:text-gray-400">User ID</div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{details?.user_id ?? "—"}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{new Date(details?.created_at || order.created_at).toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-xs text-gray-500 dark:text-gray-400">Updated</div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{new Date(details?.updated_at || order.updated_at).toLocaleString()}</div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Items</div>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ) : details?.items && details.items.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {details.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between py-2">
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {it.product?.name || `Product #${it.product_id}`} × {it.quantity} {it.size ? `(size ${it.size})` : ""}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(it.price * it.quantity).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">No items</div>
        )}
      </div>
    </div>
  );
}

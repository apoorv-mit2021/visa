import {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams, useLocation} from "react-router-dom";
import PageMeta from "../components/common/PageMeta";
import ProductForm, {type ProductFormMode} from "../components/ecommerce/Products/ProductForm";
import {toast} from "sonner";
import axios from "axios";
import {useAuth} from "../context/AuthContext";
import {
    createProduct,
    getProduct,
    updateProduct,
    type Product,
    type ProductCreatePayload,
    type ProductUpdatePayload,
} from "../services/productService";

export default function ProductEditor() {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const {token} = useAuth();

    const productId = params.id ? Number(params.id) : undefined;

    const mode: ProductFormMode = useMemo(() => {
        if (!productId) return "create";
        return location.pathname.endsWith("/edit") ? "edit" : "view";
    }, [location.pathname, productId]);

    const [product, setProduct] = useState<Product | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(!!productId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch product when viewing/editing
    useEffect(() => {
        let ignore = false;
        const fetchProduct = async () => {
            if (!productId) return;
            if (!token) {
                toast.error("Unauthorized. Please log in again.");
                return;
            }
            setLoading(true);
            try {
                const data = await getProduct(token, productId);
                if (!ignore) setProduct(data);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
                    toast.error(detail || "Failed to load product.");
                } else {
                    toast.error("Unexpected error while loading product.");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        fetchProduct();
        return () => {
            ignore = true;
        };
    }, [productId, token]);

    const handleSubmit = async (
        data: ProductCreatePayload | { id: number; data: ProductUpdatePayload }
    ) => {
        if (!token) {
            toast.error("Unauthorized. Please log in again.");
            return;
        }

        try {
            setIsSubmitting(true);
            if (mode === "create") {
                await createProduct(token, data as ProductCreatePayload);
                toast.success("Product created successfully!");
            } else {
                const payload = data as { id: number; data: ProductUpdatePayload };
                await updateProduct(token, payload.id, payload.data);
                toast.success("Product updated successfully!");
            }
            navigate("/products", {replace: true});
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
                toast.error(detail || "Request failed");
            } else {
                toast.error("Unexpected error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const title = mode === "create" ? "Create Product" : mode === "edit" ? "Edit Product" : "Product Details";

    return (
        <div className="space-y-4">
            <PageMeta title={`${title} | Auri Admin`} description="Manage product details"/>

            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{title}</h1>
                <button
                    type="button"
                    onClick={() => navigate("/products")}
                    className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-sm"
                >
                    Back to Products
                </button>
            </div>

            <div className="border rounded-md bg-white dark:bg-gray-800">
                {loading && productId ? (
                    <div className="p-6 text-sm text-gray-500">Loading...</div>
                ) : (
                    <ProductForm
                        mode={mode}
                        product={product}
                        isSubmitting={isSubmitting}
                        onSubmit={handleSubmit}
                    />
                )}
            </div>
        </div>
    );
}

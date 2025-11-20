import PageMeta from "../components/common/PageMeta";
import ProductHeader from "../components/ecommerce/Products/ProductHeader.tsx";
import ProductMetrics from "../components/ecommerce/Products/ProductMetrics";
import ProductTable from "../components/ecommerce/Products/ProductTable";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import type {AdminProductListItem} from "../services/productService";

export default function Products() {
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    const openCreate = () => {
        navigate("/products/new");
    };

    const handleView = (product: AdminProductListItem) => {
        navigate(`/products/${product.id}`);
    };

    const handleEdit = (product: AdminProductListItem) => {
        navigate(`/products/${product.id}/edit`);
    };

    return (
        <>
            <PageMeta
                title="Products | Auri Admin"
                description="Manage products, view performance metrics, and organize items in Auri Admin."
            />

            <div className="mb-6">
                <ProductHeader onAddProduct={openCreate} onRefresh={handleRefresh}/>
            </div>

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6">
                    <ProductMetrics refreshKey={refreshKey}/>
                </div>
                <div className="col-span-12 space-y-6">
                    <ProductTable refreshKey={refreshKey} onView={handleView} onEdit={handleEdit}/>
                </div>
            </div>
        </>
    );
}

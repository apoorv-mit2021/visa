// src/components/auth/ProtectedRoute.tsx

import {ReactElement} from "react";
import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../../context/AuthContext";
import Loader from "../../components/common/Loader";

interface ProtectedRouteProps {
    children?: ReactElement;
    allowedRoles?: string[];
}

export default function ProtectedRoute({children, allowedRoles}: ProtectedRouteProps) {
    const {user, isAuthenticated, isLoading} = useAuth();

    // 🔄 Still loading auth state
    if (isLoading) return <Loader/>;

    // 🚪 Not logged in → redirect to signin
    if (!isAuthenticated) return <Navigate to="/signin" replace/>;

    // 🧩 If allowedRoles are defined, check if user has one
    if (allowedRoles?.length) {
        const userRoles = user?.roles || [];
        const hasPermission = userRoles.some((role: string) => allowedRoles.includes(role));

        if (!hasPermission) {
            return <Navigate to="/unauthorized" replace/>;
        }
    }

    // ✅ Render either nested routes or the passed child
    return children ? children : <Outlet/>;
}

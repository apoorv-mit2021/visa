// src/hooks/useRole.ts
import {useAuth} from "../context/AuthContext";

/**
 * useRole()
 * A lightweight hook to simplify role-based logic throughout the app.
 * It centralizes role detection and provides helper utilities.
 */
export function useRole() {
    const {user} = useAuth();
    const roles = user?.roles || [];

    /**
     * Check if the user has one of the specified roles
     */
    const hasRole = (role: string | string[]) => {
        if (Array.isArray(role)) {
            return role.some((r) => roles.includes(r));
        }
        return roles.includes(role);
    };

    return {
        roles,
        isAdmin: roles.includes("admin"),
        isStaff: roles.includes("staff"),
        hasRole,
        isAdminOrStaff: roles.includes("admin") || roles.includes("staff"),
    };
}

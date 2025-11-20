// src/context/AuthContext.tsx

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from "react";
import {
    login as loginService,
    logout as logoutService,
    getProfile,
} from "../services/authService";

interface User {
    id?: number;
    email: string;
    full_name?: string;
    roles: string[];
    is_verified?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(
        localStorage.getItem("token")
    );
    const [isLoading, setIsLoading] = useState(true);

    // 🚪 Stable logout function (prevents redefinition)
    const logout = useCallback(() => {
        logoutService();
        setToken(null);
        setUser(null);
    }, []);

    // 🔄 Initialize on app load or token change
    useEffect(() => {
        const initialize = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const userData = await getProfile(token);
                setUser(userData);
            } catch (err) {
                console.warn("Invalid or expired token, logging out...");
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, [token, logout]);

    // 🔐 Login flow
    const login = async (email: string, password: string) => {
        const response = await loginService({email, password});
        localStorage.setItem("token", response.access_token);
        setToken(response.access_token);

        try {
            const userData = await getProfile(response.access_token);
            setUser(userData);
        } catch (error) {
            console.error("Failed to fetch user profile after login:", error);
            logout();
        }
    };

    // 👂 Sync logout across tabs
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "token" && !event.newValue) {
                setToken(null);
                setUser(null);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const hasRole = (role: string): boolean => {
        return user?.roles?.includes(role) ?? false;
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

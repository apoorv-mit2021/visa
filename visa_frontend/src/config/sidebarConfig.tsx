// src/config/sidebarConfig.tsx

import {
    LayoutDashboard,
    Box,
    ShoppingCart,
    Users,
    Grid,
    // BarChart3,
    PackageSearch,
    TicketPercent,
    FolderOpen,
    UserCog,
    // DollarSign,
    Settings,
} from "lucide-react";
import {ReactNode} from "react";

export type NavItem = {
    name: string;
    icon: ReactNode;
    path: string;
    section?: string;
    allowedRoles?: string[];
};

export const navItems: NavItem[] = [
    {
        name: "Dashboard",
        icon: <LayoutDashboard/>,
        path: "/",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Collections",
        icon: <Grid/>,
        path: "/collections",
        section: "Store Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Products",
        icon: <Box/>,
        path: "/products",
        section: "Store Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Inventory",
        icon: <PackageSearch/>,
        path: "/inventory",
        section: "Store Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Coupons",
        icon: <TicketPercent/>,
        path: "/coupons",
        section: "Store Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Customers",
        icon: <Users/>,
        path: "/customers",
        section: "Customers & Orders",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Orders",
        icon: <ShoppingCart/>,
        path: "/orders",
        section: "Customers & Orders",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Cases",
        icon: <FolderOpen/>,
        path: "/cases",
        section: "Customers & Orders",
        allowedRoles: ["admin", "staff"],
    },
    // {
    //     name: "Analytics",
    //     icon: <BarChart3/>,
    //     path: "/analytics",
    //     section: "Finance & Analytics",
    //     allowedRoles: ["admin", "staff"],
    // },
    // {
    //     name: "Financials",
    //     icon: <DollarSign/>,
    //     path: "/financials",
    //     section: "Finance & Analytics",
    //     allowedRoles: ["admin", "staff"],
    // },
    {
        name: "Employees",
        icon: <UserCog/>,
        path: "/employees",
        section: "Management",
        allowedRoles: ["admin"], // 🔒 admin only
    },
    {
        name: "Settings",
        icon: <Settings/>,
        path: "/settings",
        section: "Management",
        allowedRoles: ["admin", "staff"],
    },
];

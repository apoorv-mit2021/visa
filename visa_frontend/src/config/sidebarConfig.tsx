// src/config/sidebarConfig.tsx

import {
    LayoutDashboard,
    Stamp,
    FileUser,
    Users,
    Earth,
    BarChart3,
    FolderOpen,
    UserCog,
    DollarSign,
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
        name: "Countries",
        icon: <Earth/>,
        path: "/countries",
        section: "Configurations",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Visa Product",
        icon: <Stamp/>,
        path: "/products",
        section: "Configurations",
        allowedRoles: ["admin", "staff"],
    },
    // {
    //     name: "Inventory",
    //     icon: <PackageSearch/>,
    //     path: "/inventory",
    //     section: "Store Management",
    //     allowedRoles: ["admin", "staff"],
    // },
    // {
    //     name: "Coupons",
    //     icon: <TicketPercent/>,
    //     path: "/coupons",
    //     section: "Store Management",
    //     allowedRoles: ["admin", "staff"],
    // },
    {
        name: "B2C Customers",
        icon: <Users/>,
        path: "/b2c/customers",
        section: "Customer Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "B2B Customers",
        icon: <Users/>,
        path: "/b2b/customers",
        section: "Customer Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "B2E Customers",
        icon: <Users/>,
        path: "/b2e/customers",
        section: "Customer Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Applications",
        icon: <FileUser/>,
        path: "/orders",
        section: "Application Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Tickets",
        icon: <FolderOpen/>,
        path: "/cases",
        section: "Application Management",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Analytics",
        icon: <BarChart3/>,
        path: "/analytics",
        section: "Finance & Analytics",
        allowedRoles: ["admin", "staff"],
    },
    {
        name: "Financials",
        icon: <DollarSign/>,
        path: "/financials",
        section: "Finance & Analytics",
        allowedRoles: ["admin", "staff"],
    },

    {
        name: "Staff",
        icon: <UserCog/>,
        path: "/employees",
        section: "System Management",
        allowedRoles: ["admin"], // 🔒 admin only
    },
    {
        name: "Settings",
        icon: <Settings/>,
        path: "/settings",
        section: "System Management",
        allowedRoles: ["admin", "staff"],
    },
];

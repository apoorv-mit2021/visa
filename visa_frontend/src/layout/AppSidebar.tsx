// src/layout/AppSidebar.tsx

import {useCallback, useMemo} from "react";
import {Link, useLocation} from "react-router";
import {MoreHorizontal} from "lucide-react";
import {useSidebar} from "../context/SidebarContext";
import {useRole} from "../hooks/useRole";
import BrandLogo from "../components/common/BrandLogo";
import {navItems} from "../config/sidebarConfig";

const AppSidebar: React.FC = () => {
    const {isExpanded, isMobileOpen, isHovered, setIsHovered} = useSidebar();
    const {hasRole} = useRole(); // ✅ useRole hook here
    const location = useLocation();

    const isActive = useCallback(
        (path: string) => location.pathname === path,
        [location.pathname]
    );

    // ✅ Filter items based on allowed roles (from config)
    const accessibleItems = useMemo(() => {
        return navItems.filter(
            (item) => !item.allowedRoles || hasRole(item.allowedRoles)
        );
    }, [hasRole]);

    // ✅ Group items by section
    const groupedItems = useMemo(() => {
        return accessibleItems.reduce((acc, item) => {
            if (!item.section) return acc;
            if (!acc[item.section]) acc[item.section] = [];
            acc[item.section].push(item);
            return acc;
        }, {} as Record<string, typeof accessibleItems>);
    }, [accessibleItems]);

    const dashboardItem = accessibleItems.find((i) => !i.section);

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
                ${
                isExpanded || isMobileOpen
                    ? "w-[220px]"
                    : isHovered
                        ? "w-[220px]"
                        : "w-[90px]"
            }
                ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Brand Logo */}
            <BrandLogo
                isExpanded={isExpanded}
                isHovered={isHovered}
                isMobileOpen={isMobileOpen}
            />

            {/* Sidebar Menu */}
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="mb-4">
                    {/* Dashboard (no section header) */}
                    {dashboardItem && (
                        <ul className="flex flex-col gap-2 mb-4">
                            <li key={dashboardItem.name}>
                                <SidebarLink
                                    item={dashboardItem}
                                    isActive={isActive(dashboardItem.path)}
                                    expanded={isExpanded || isHovered || isMobileOpen}
                                />
                            </li>
                        </ul>
                    )}

                    {/* Grouped Sections */}
                    {Object.entries(groupedItems).map(([section, items]) => (
                        <div key={section} className="flex flex-col gap-2 mb-4">
                            <SidebarSectionHeader
                                name={section}
                                expanded={isExpanded || isHovered || isMobileOpen}
                            />
                            <ul className="flex flex-col gap-2">
                                {items.map((item) => (
                                    <li key={item.name}>
                                        <SidebarLink
                                            item={item}
                                            isActive={isActive(item.path)}
                                            expanded={isExpanded || isHovered || isMobileOpen}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
};

export default AppSidebar;

/* -------------------------- */
/* 🔹 Helper Components */

/* -------------------------- */

function SidebarLink({
                         item,
                         isActive,
                         expanded,
                     }: {
    item: any;
    isActive: boolean;
    expanded: boolean;
}) {
    return (
        <Link
            to={item.path}
            className={`menu-item group ${
                isActive ? "menu-item-active" : "menu-item-inactive"
            }`}
        >
            <span
                className={`menu-item-icon-size ${
                    isActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
                }`}
            >
                {item.icon}
            </span>
            {expanded && <span className="menu-item-text">{item.name}</span>}
        </Link>
    );
}

function SidebarSectionHeader({
                                  name,
                                  expanded,
                              }: {
    name: string;
    expanded: boolean;
}) {
    return (
        <h2
            className={`text-[10px] uppercase flex leading-4 text-gray-400 mb-1 ${
                !expanded ? "lg:justify-center" : "justify-start"
            }`}
        >
            {expanded ? name : <MoreHorizontal className="size-4"/>}
        </h2>
    );
}

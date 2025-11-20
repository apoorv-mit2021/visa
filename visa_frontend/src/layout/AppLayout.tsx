// src/layout/AppLayout.tsx

import {SidebarProvider, useSidebar} from "../context/SidebarContext";
import {Outlet} from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
    const {isExpanded, isHovered, isMobileOpen} = useSidebar();

    return (
        <div className="min-h-screen xl:flex">
            <div>
                <AppSidebar/>
                <Backdrop/>
            </div>
            <div
                className={`relative flex flex-1 w-full flex-col h-screen transition-all duration-300 ease-in-out ${
                    isExpanded || isHovered ? "lg:ml-[220px]" : "lg:ml-[90px]"
                } ${isMobileOpen ? "ml-0" : ""}`}
            >
                {/* Sticky Header */}
                <AppHeader/>

                {/* Main Content Area */}
                <div className="relative flex-1 overflow-y-auto app-scroll p-4 md:p-6">
                    <Outlet/>
                </div>
            </div>
        </div>
    );
};

const AppLayout: React.FC = () => {
    return (
        <SidebarProvider>
            <LayoutContent/>
        </SidebarProvider>
    );
};

export default AppLayout;

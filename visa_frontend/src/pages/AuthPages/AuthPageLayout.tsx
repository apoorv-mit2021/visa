import React from "react";
import GridShape from "../../components/common/GridShape";
import {Link} from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import {Gem} from "lucide-react";

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
            <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
                {/* Left Side (Form Section) */}
                {children}

                {/* Right Side (Brand / Background Section) */}
                <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
                    <div className="relative flex items-center justify-center z-1">
                        <GridShape/>

                        <div className="flex flex-col items-center max-w-xs">
                            <Link to="/" className="block">
                                <div className="py-8 flex items-center justify-center transition-all duration-300">
                                    <div className="flex items-center space-x-3">
                                        {/* Icon */}
                                        <div
                                            className="p-2.5 bg-gradient-to-r from-brand-500 to-brand-700 rounded-xl shadow-sm">
                                            <Gem className="h-6 w-6 text-white"/>
                                        </div>

                                        {/* Branding */}
                                        <div className="flex flex-col leading-tight">
                                            <h1 className="text-xl font-bold text-white">HEYOKA</h1>
                                            <p className="text-xs text-white/80">Admin Dashboard</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <p className="text-center text-white/70">
                                HEYOKA Luxury Jewelry — Admin Dashboard
                            </p>
                        </div>
                    </div>
                </div>

                {/* Floating Theme Toggle */}
                <div className="fixed z-50 hidden top-6 right-6 sm:block">
                    <ThemeTogglerTwo/>
                </div>
            </div>
        </div>
    );
}

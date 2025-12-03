import {Gem} from "lucide-react";
import {Link} from "react-router-dom";

interface BrandLogoProps {
    isExpanded?: boolean;
    isHovered?: boolean;
    isMobileOpen?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
                                                 isExpanded,
                                                 isHovered,
                                                 isMobileOpen,
                                             }) => {
    const isVisible = isExpanded || isHovered || isMobileOpen;

    return (
        <div
            className={`py-8 flex items-center ${
                !isVisible ? "lg:justify-center" : "justify-start"
            } transition-all duration-300`}
        >
            <Link to="/" className="flex items-center space-x-3">
                {/* Icon */}
                <div className="p-2.5 bg-gradient-to-r from-brand-500 to-brand-700 rounded-xl shadow-sm">
                    <Gem className="h-6 w-6 text-white"/>
                </div>

                {/* Branding (only when expanded or hovered) */}
                {isVisible && (
                    <div className="flex flex-col leading-tight">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            HEYOKA
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Admin Dashboard
                        </p>
                    </div>
                )}
            </Link>
        </div>
    );
};

export default BrandLogo;

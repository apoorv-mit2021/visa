import React, {ReactNode, FC} from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode; // Button text or content
    size?: "sm" | "md"; // Button size variants
    variant?: "primary" | "outline"; // Button styling variants
    startIcon?: ReactNode; // Icon before the text
    endIcon?: ReactNode; // Icon after the text
    className?: string; // Extra custom styling
}

const Button: FC<ButtonProps> = ({
                                     children,
                                     size = "md",
                                     variant = "primary",
                                     startIcon,
                                     endIcon,
                                     className = "",
                                     disabled = false,
                                     type = "button",
                                     ...rest
                                 }) => {
    const sizeClasses: Record<string, string> = {
        sm: "px-4 py-2.5 text-sm",
        md: "px-5 py-3 text-base",
    };

    const variantClasses: Record<string, string> = {
        primary:
            "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 dark:bg-brand-600 dark:hover:bg-brand-500",
        outline:
            "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-100",
    };

    const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-lg font-medium 
    transition duration-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/30
    ${sizeClasses[size]} ${variantClasses[variant]}
    ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}
  `;

    return (
        <button
            type={type}
            className={baseClasses}
            disabled={disabled}
            {...rest}
        >
            {startIcon && <span className="flex items-center">{startIcon}</span>}
            {children}
            {endIcon && <span className="flex items-center">{endIcon}</span>}
        </button>
    );
};

export default Button;

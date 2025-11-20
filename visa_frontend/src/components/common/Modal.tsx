import {useRef, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    className?: string;
    children: React.ReactNode;
    showCloseButton?: boolean;
    isFullscreen?: boolean;
    backdropBlur?: boolean;
}

/**
 * ✅ Common Modal Component (Scalable & Production-Ready)
 * - Handles ESC & backdrop close
 * - Locks body scroll when open
 * - Responsive & theme-aware
 * - Animated with Framer Motion
 */
export const Modal: React.FC<ModalProps> = ({
                                                isOpen,
                                                onClose,
                                                title,
                                                className = "",
                                                children,
                                                showCloseButton = true,
                                                isFullscreen = false,
                                                backdropBlur = true,
                                            }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // 🔹 Handle ESC key close
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        if (isOpen) document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // 🔹 Lock scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center"
                    aria-modal="true"
                    role="dialog"
                >
                    {/* 🔸 Backdrop */}
                    <motion.div
                        className={`fixed inset-0 bg-black/50 ${
                            backdropBlur ? "backdrop-blur-[20px]" : ""
                        }`}
                        onClick={onClose}
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                    />

                    {/* 🔸 Modal Container */}
                    <motion.div
                        ref={modalRef}
                        className={`relative z-[10000] flex flex-col ${
                            isFullscreen
                                ? "w-full h-full rounded-none"
                                : "w-full max-w-lg md:max-w-2xl rounded-2xl"
                        } bg-white dark:bg-gray-900 shadow-2xl transition-all ${className}`}
                        initial={{opacity: 0, scale: 0.95, y: 20}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.95, y: 20}}
                        transition={{duration: 0.25, ease: "easeInOut"}}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 🔹 Header */}
                        {(title || showCloseButton) && (
                            <div
                                className="relative flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                                {title && (
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                        {title}
                                    </h2>
                                )}

                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        aria-label="Close modal"
                                        className="flex h-9 w-9 items-center justify-center rounded-full
                               bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700
                               dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white
                               transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M6.04 16.54c-.39.39-.39 1.03 0 1.42.39.39 1.03.39 1.42 0l4.54-4.54 4.54 4.54c.39.39 1.03.39 1.42 0 .39-.39.39-1.03 0-1.42L13.42 12l4.54-4.54c.39-.39.39-1.03 0-1.42-.39-.39-1.03-.39-1.42 0L12 10.58 7.46 6.04a1.003 1.003 0 0 0-1.42 1.42L10.58 12l-4.54 4.54z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* 🔹 Body */}
                        <div className="flex-1 overflow-y-auto p-6">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

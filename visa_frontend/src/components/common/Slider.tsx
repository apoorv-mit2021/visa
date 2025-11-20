import React from "react";
import {AnimatePresence, motion} from "framer-motion";

interface SliderProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    headerIcon?: React.ReactNode;
    children: React.ReactNode;
    maxWidthClass?: string;
    backdropBlur?: boolean;
    disableBackdropClose?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
                                                  isOpen,
                                                  onClose,
                                                  title,
                                                  headerIcon,
                                                  children,
                                                  maxWidthClass = "sm:max-w-md md:max-w-lg lg:max-w-xl",
                                                  backdropBlur = true,
                                                  disableBackdropClose = false,
                                              }) => {
    // 🔹 Disable body scroll when open
    React.useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // 🔹 Position slider below the sticky app header
    const [headerOffset, setHeaderOffset] = React.useState<number>(0);

    React.useLayoutEffect(() => {
        const headerEl = document.querySelector("header.sticky") as HTMLElement | null;
        if (!headerEl) {
            setHeaderOffset(0);
            return;
        }

        const updateOffset = () => {
            setHeaderOffset(headerEl.offsetHeight || 0);
        };

        // Observe header size changes (responsive, menu open/close)
        let ro: ResizeObserver | null = null;
        try {
            ro = new ResizeObserver(() => updateOffset());
            ro.observe(headerEl);
        } catch (e) {
            // ResizeObserver may not be available in all environments
        }

        // Also update on window resize just in case
        window.addEventListener("resize", updateOffset);
        updateOffset();

        return () => {
            window.removeEventListener("resize", updateOffset);
            if (ro) ro.disconnect();
        };
    }, []);

    return (

        <div
            className={`fixed inset-x-0 bottom-0 z-40 overflow-hidden transition-all duration-300 ${
                isOpen ? "" : "pointer-events-none"
            }`}
            style={{top: headerOffset}}
        >

            {/* 🔸 Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="slider-backdrop"
                        className={`absolute inset-0 bg-black/40 ${
                            backdropBlur ? "backdrop-blur-[20px]" : ""
                        }`}
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.25}}
                        onClick={!disableBackdropClose ? onClose : undefined}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* 🔸 Slide Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="slider-panel"
                        initial={{x: "100%"}}
                        animate={{x: 0}}
                        exit={{x: "100%"}}
                        transition={{type: "tween", duration: 0.2, ease: "easeInOut"}}
                        className={`absolute inset-y-0 right-0 flex max-w-full`}
                    >
                        <div
                            className={`relative flex h-full w-screen transform flex-col bg-white shadow-xl transition-all dark:bg-gray-900 ${maxWidthClass}`}
                        >
                            {/* Header */}
                            {(title || headerIcon) && (
                                <div
                                    className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                                    <div className="flex items-center gap-2">
                                        {headerIcon}
                                        {title && (
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {title}
                                            </h2>
                                        )}
                                    </div>
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
                                </div>
                            )}

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

import {useState, useCallback, useEffect} from "react";

type Position = { top: number; left: number; placement?: "bottom" | "top" };

/**
 * A smart dropdown positioning hook that:
 * - Positions dropdown below or above trigger automatically
 * - Auto-closes on scroll or resize
 * - Prevents overflow from viewport edges
 */
export function useDropdownPosition() {
    const [position, setPosition] = useState<Position>({top: 0, left: 0, placement: "bottom"});
    const [isVisible, setIsVisible] = useState(false);

    const calculatePosition = useCallback(
        (button: HTMLElement, dropdownWidth = 150, dropdownHeight = 100, offsetY = 8, offsetX = 0) => {
            if (!button) return;

            const rect = button.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Default below the button
            let top = rect.bottom + offsetY;
            let left = rect.right - dropdownWidth + offsetX;
            let placement: "bottom" | "top" = "bottom";

            // Flip upward if dropdown would overflow bottom
            if (rect.bottom + dropdownHeight + offsetY > viewportHeight) {
                top = rect.top - dropdownHeight - offsetY;
                placement = "top";
            }

            // Clamp horizontally to viewport
            if (left + dropdownWidth > viewportWidth - 8) {
                left = viewportWidth - dropdownWidth - 8;
            }
            if (left < 8) {
                left = 8;
            }

            setPosition({top, left, placement});
            setIsVisible(true);
        },
        []
    );

    const hideDropdown = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Auto-close on scroll or resize
    useEffect(() => {
        if (!isVisible) return;

        const handleScroll = () => hideDropdown();
        const handleResize = () => hideDropdown();

        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
        };
    }, [isVisible, hideDropdown]);

    return {position, calculatePosition, isVisible, hideDropdown};
}

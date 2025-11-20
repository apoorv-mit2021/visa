import {useState, useCallback} from "react";

export const useSlider = (initialState: boolean = false) => {
    const [isOpen, setIsOpen] = useState(initialState);

    const openSlider = useCallback(() => setIsOpen(true), []);
    const closeSlider = useCallback(() => setIsOpen(false), []);
    const toggleSlider = useCallback(() => setIsOpen((prev) => !prev), []);

    return {isOpen, openSlider, closeSlider, toggleSlider};
};

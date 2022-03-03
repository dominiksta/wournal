import { useEffect, RefObject } from "react";
import { APP_ROOT_ELEMENT } from "../..";

/**
 * Call `handler` on mouse/touch events *outside* of the element passed in as
 * `ref` *once*.
 */
export default function useOnClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: (event: MouseEvent | TouchEvent) => void
) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const el = ref?.current;
            // Call the handler only if the click is outside of the element
            // passed.
            if (!el || el.contains((event?.target as Node) || null)) return;
            handler(event);
        };

        APP_ROOT_ELEMENT.addEventListener("mousedown", listener);
        APP_ROOT_ELEMENT.addEventListener("touchstart", listener);

        return () => {
            APP_ROOT_ELEMENT.removeEventListener("mousedown", listener);
            APP_ROOT_ELEMENT.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]); // Reload only if ref or handler changes
};

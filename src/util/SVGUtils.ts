export const SVGUtils = {
    /** Check if `inner` is in `outer` */
    rectInRect: function(outer: DOMRect, inner: DOMRect) {
        return outer.top <= inner.top &&
            outer.bottom >= inner.bottom &&
            outer.left <= inner.left &&
            outer.right >= inner.right;
    }
}

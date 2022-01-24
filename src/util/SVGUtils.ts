export const SVGUtils = {
    /** Check if `inner` is in `outer` */
    rectInRect: function(outer: DOMRect, inner: DOMRect) {
        return outer.top <= inner.top &&
            outer.bottom >= inner.bottom &&
            outer.left <= inner.left &&
            outer.right >= inner.right;
    },

    /** Check if `pt` is in `r` */
    pointInRect: function(pt: {x: number, y: number}, r: DOMRect) {
        return pt.y >= r.top && pt.y <= r.bottom &&
            pt.x <= r.right && pt.x >= r.left
    }
}

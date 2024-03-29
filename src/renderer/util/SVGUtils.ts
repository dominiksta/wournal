import { Rect } from "document/types";

export const SVGUtils = {
  create: function<K extends keyof SVGElementTagNameMap>(
    name: K, attrs?: { [key: string]: any },
  ): SVGElementTagNameMap[K] {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (!attrs) return el;
    for (const key in attrs) el.setAttribute(key, attrs[key].toString());
    return el;
  },

  /** Check if `inner` is in `outer` */
  rectInRect: function(outer: DOMRect, inner: DOMRect) {
    return outer.top <= inner.top &&
      outer.bottom >= inner.bottom &&
      outer.left <= inner.left &&
      outer.right >= inner.right;
  },

  scaleRect: function(rect: Rect, factor: number): Rect {
    return {
      x: rect.x * factor, y: rect.y * factor,
      width: rect.width * factor, height: rect.height * factor,
    }
  },

  /** Check if `pt` is in `r` */
  pointInRect: function(pt: { x: number, y: number }, r: DOMRect) {
    return pt.y >= r.top && pt.y <= r.bottom &&
      pt.x <= r.right && pt.x >= r.left
  },

  /** compute the distance between to points */
  pointDistance: function(
    p1: { x: number, y: number }, p2: { x: number, y: number }
  ): number {
    // pythagoras
    return Math.sqrt(
      (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2
    );
  },

  /** Wether r1 and r2 have any intersection */
  rectIntersect: function(r1: DOMRect, r2: DOMRect): boolean {
    return !(
      r2.left > r1.right || r2.right < r1.left ||
      r2.top > r1.bottom || r2.bottom < r1.top
    );
  },

  /** Compute scale factor for font and stroke width */
  scaleFactor: function(scaleX: number, scaleY: number) {
    return (scaleX === 1 && scaleY === 1) ?
      scaleX * scaleY : Math.sqrt(scaleX * scaleY);
  },

  /** Return a bounding rectangle encompassing both `r1` and `r2` */
  boundingRectForTwo(r1: DOMRect, r2: DOMRect): DOMRect {
    return DOMRect.fromRect({
      x: r1.x < r2.x ? r1.x : r2.x,
      y: r1.y < r2.y ? r1.y : r2.y,
      width: (r1.right > r2.right ? r1.right : r2.right) -
        (r1.left < r2.left ? r1.left : r2.left),
      height: (r1.bottom > r2.bottom ? r1.bottom : r2.bottom) -
        (r1.top < r2.top ? r1.top : r2.top),
    });
  },

  /** Display `r` in `canvas` for `ms` milliseconds. Inteded for debugging. */
  tmpDisplayRect: async function(
    r: DOMRect, canvas: SVGSVGElement, ms: number = 1000, color = "red"
  ) {
    let rect = canvas.ownerDocument.createElementNS(
      "http://www.w3.org/2000/svg", "rect"
    );
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-opacity", "0.5");
    rect.setAttribute("fill", color);
    rect.setAttribute("fill-opacity", "0.5");
    rect.setAttribute("x", r.x.toString());
    rect.setAttribute("y", r.y.toString());
    rect.setAttribute("height", r.height.toString());
    rect.setAttribute("width", r.width.toString());

    canvas.appendChild(rect);

    return new Promise<void>(resolve => {
      setTimeout(() => {
        canvas.removeChild(rect);
        resolve();
      }, ms);
    })
  },

  /** Display `pt` in `canvas` for `ms` milliseconds. Inteded for debugging. */
  tmpDisplayPoint(
    pt: { x: number, y: number }, canvas: SVGSVGElement,
    ms: number = 1000, color: string = "red"
  ) {
    this.tmpDisplayRect(DOMRect.fromRect({
      x: pt.x - 2, y: pt.y - 2,
      height: 4, width: 4
    }), canvas, ms, color);
  },
}

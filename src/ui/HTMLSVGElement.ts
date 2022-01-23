/**
 * Apparently, an SVG element inside a DOM implements both the HTMLElement and
 * SVGElement interfaces. So this is a little helper type to work with these
 * elements.
 */
export type HTMLSVGElement = HTMLElement & SVGElement;

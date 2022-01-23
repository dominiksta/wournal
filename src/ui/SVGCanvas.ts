import { HTMLSVGElement } from "./HTMLSVGElement";

/**
 * An SVG Canvas to draw on.
 */
export class SVGCanvas {

    /** The Canvas Element that will be drawn on */
    private svgElement: HTMLSVGElement;
    /** The bounding rectangle of `_svgElement` */
    private rect: DOMRect;

    /** The width of a stroke */
    private strokeWidth = 2;
    /** Buffer size for line smoothing */
    public mouseBufferSize = 4;
    /** Buffer for smoothing. Contains the last positions of the mouse cursor */
    private mouseBuffer: {x: number, y: number}[] = [];

    /** The svg path for the current line */
    private path: SVGPathElement | null = null;
    /** The stroke path for the current line */
    private pathStroke = "";

    constructor(svgElement: HTMLSVGElement) {
        this.svgElement = svgElement;
        this.rect = svgElement.getBoundingClientRect();

        this.svgElement.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.svgElement.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.svgElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    }

    private onMouseDown(e: MouseEvent) {
        this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.path.setAttribute("fill", "none");
        this.path.setAttribute("stroke", "#000");
        this.path.setAttribute("stroke-width", this.strokeWidth.toString());
        this.mouseBuffer = [];
        var pt = this.getMousePosition(e);
        this.appendToBuffer(pt);
        this.pathStroke = "M" + pt.x + " " + pt.y;
        this.path.setAttribute("d", this.pathStroke);
        this.svgElement.appendChild(this.path);
    }

    private onMouseMove(e: MouseEvent) {
        console.log("onMouseMove");
        if (this.path) {
            this.appendToBuffer(this.getMousePosition(e));
            this.updateSvgPath();
        }
    }

    private onMouseUp(e: MouseEvent) {
        console.log("onMouseUp");
        if (this.path) this.path = null;
    }

    private getMousePosition(e: MouseEvent) {
        return {
            x: e.pageX - this.rect.left,
            y: e.pageY - this.rect.top
        };
    }

    private appendToBuffer(pt: {x: number, y: number}) {
        this.mouseBuffer.push(pt);
        while (this.mouseBuffer.length > this.mouseBufferSize) {
            this.mouseBuffer.shift();
        }
    }

    /** Calculate the average point, starting at offset in the buffer */
    private getAveragePoint(offset: number): {x: number, y: number} | null {
        var len = this.mouseBuffer.length;
        if (len % 2 === 1 || len >= this.mouseBufferSize) {
            var totalX = 0;
            var totalY = 0;
            var pt, i;
            var count = 0;
            for (i = offset; i < len; i++) {
                count++;
                pt = this.mouseBuffer[i];
                totalX += pt.x;
                totalY += pt.y;
            }
            return {
                x: totalX / count,
                y: totalY / count
            };
        }
        return null;
    }

    private updateSvgPath() {
        var pt = this.getAveragePoint(0);

        if (pt) {
            // Get the smoothed part of the path that will not change
            this.pathStroke += " L" + pt.x + " " + pt.y;

            // Get the last part of the path (close to the current mouse position)
            // This part will change if the mouse moves again
            var tmpPath = "";
            for (var offset = 2; offset < this.mouseBuffer.length; offset += 2) {
                pt = this.getAveragePoint(offset);
                tmpPath += " L" + pt.x + " " + pt.y;
            }

            // Set the complete current path coordinates
            this.path.setAttribute("d", this.pathStroke + tmpPath);
        }
    }
}

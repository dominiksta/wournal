import { CONF } from "../util/Config";
import { SVGCanvas } from "./SVGCanvas";
import { SVGCanvasTool } from "./SVGCanvasTool";

export class SVGCanvasToolPen extends SVGCanvasTool {

    /** The width of a stroke */
    private strokeWidth = 2;
    /** Buffer for smoothing. Contains the last positions of the mouse cursor */
    private mouseBuffer: {x: number, y: number}[] = [];

    /** The svg path for the current line */
    private path: SVGPathElement | null = null;
    /** The stroke path for the current line */
    private pathStroke = "";

    protected cursor = "url('res/cursor/pen.png'), auto";

    constructor(
        protected canvas: SVGCanvas,
    ) {
        super(canvas);
        this.canvas.svgElement.style.cursor = this.cursor;
    }

    public onMouseDown(e: MouseEvent): void {
        this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.path.setAttribute("fill", "none");
        this.path.setAttribute("stroke", "#000");
        this.path.setAttribute("stroke-width", this.strokeWidth.toString());
        this.mouseBuffer = [];
        var pt = this.canvas.posForEvent(e);
        this.appendToBuffer(pt);
        this.pathStroke = "M" + pt.x + " " + pt.y;
        this.path.setAttribute("d", this.pathStroke);
        this.canvas.svgElement.appendChild(this.path);
    }

    public onMouseUp(e: MouseEvent): void {
        if (this.path) this.path = null;
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.path) {
            this.appendToBuffer(this.canvas.posForEvent(e));
            this.updateSvgPath();
        }
    }

    /** Calculate the average point, starting at offset in the buffer */
    private getAveragePoint(offset: number): {x: number, y: number} | null {
        var len = this.mouseBuffer.length;
        if (len % 2 === 1 || len >= CONF.pen.mouseBufferSize) {
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

    private appendToBuffer(pt: {x: number, y: number}) {
        this.mouseBuffer.push(pt);
        while (this.mouseBuffer.length > CONF.pen.mouseBufferSize) {
            this.mouseBuffer.shift();
        }
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

import { SVGCanvasTool } from "./SVGCanvasTool";
import { SVGCanvasToolPointer } from "./SVGCanvasToolPen";

/**
 * An SVG Canvas to draw on.
 */
export class SVGCanvas {

    /** The Canvas Element that will be drawn on */
    private _svgElement: SVGSVGElement;
    get svgElement() { return this._svgElement; }

    public currentTool: SVGCanvasTool;

    /**
     * The bounding rectangle of `_svgElement`. Only updated in `onMouseDown`
     * for better performance.
     */
    private _rect: DOMRect;
    get rect() { return this._rect; }

    constructor(svgElement: SVGSVGElement) {
        this._svgElement = svgElement;
        this.currentTool = new SVGCanvasToolPointer(this);

        this._svgElement.addEventListener("mousedown", this.onMouseDown.bind(this));
        this._svgElement.addEventListener("mousemove", this.onMouseMove.bind(this));
        this._svgElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    }

    private onMouseDown(e: MouseEvent) {
        this._rect = this._svgElement.getBoundingClientRect();
        this.currentTool.onMouseDown(e);
    }

    private onMouseMove(e: MouseEvent) {
        this.currentTool.onMouseMove(e);
    }

    private onMouseUp(e: MouseEvent) {
        this.currentTool.onMouseUp(e);
    }

    public posForEvent(e: MouseEvent): {x: number, y: number} {
        return {
            x: e.x - this._rect.left,
            y: e.y - this._rect.top
        };
    }
}

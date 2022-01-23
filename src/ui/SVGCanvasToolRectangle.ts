import { SVGCanvas } from "./SVGCanvas";
import { SVGCanvasTool } from "./SVGCanvasTool";

export class SVGCanvasToolRectangle extends SVGCanvasTool {
    protected cursor = "crosshair";

    constructor(
        protected canvas: SVGCanvas,
    ) {
        super(canvas);
        this.canvas.svgElement.style.cursor = this.cursor;
    }

    public onMouseDown(e: MouseEvent): void { }
    public onMouseUp(e: MouseEvent): void { }
    public onMouseMove(e: MouseEvent): void { }
}

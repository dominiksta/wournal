import { LOG } from "../util/Logging";
import { SVGCanvas } from "./SVGCanvas";
import { SVGCanvasPath } from "./SVGCanvasPath";
import { SVGCanvasTool } from "./SVGCanvasTool";

const TOOL_RECTANGLE_POINT_DIFF_PX = 5;

export class SVGCanvasToolRectangle extends SVGCanvasTool {
    protected cursor = "crosshair";

    private path: SVGCanvasPath = null;
    private pointStart: {x: number, y: number} = null;

    constructor(
        protected canvas: SVGCanvas,
    ) {
        super(canvas);
        this.canvas.svgElement.style.cursor = this.cursor;
    }

    public onMouseDown(e: MouseEvent): void {
        this.path = SVGCanvasPath.fromNewPath(
            this.canvas.svgElement.ownerDocument
        );
        this.pointStart = this.canvas.posForEvent(e)
        this.canvas.svgElement.appendChild(this.path.svgPath);
    }

    public onMouseUp(e: MouseEvent): void {
        if (this.path) this.path = null;
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.path == null) return;
        this.path.startAt(this.pointStart);
        const mouse = this.canvas.posForEvent(e);

        const goingRight = mouse.x > this.pointStart.x;
        const goingDown = mouse.y > this.pointStart.y;

        // top
        for(let x = this.pointStart.x;
            goingRight ? x <= mouse.x : x >= mouse.x;
            x += TOOL_RECTANGLE_POINT_DIFF_PX * (goingRight ? 1 : -1)) {
            this.path.addLineToPoint({x: x, y: this.pointStart.y});
        }
        // right
        for(let y = this.pointStart.y;
            goingDown ? y <= mouse.y : y >= mouse.y;
            y += TOOL_RECTANGLE_POINT_DIFF_PX * (goingDown ? 1 : -1)) {
            this.path.addLineToPoint({x: mouse.x, y: y});
        }
        // bottom
        for(let x = mouse.x;
            goingRight ? x >= this.pointStart.x : x <= this.pointStart.x;
            x += TOOL_RECTANGLE_POINT_DIFF_PX * (goingRight ? -1 : 1)) {
            this.path.addLineToPoint({x: x, y: mouse.y});
        }
        // left
        for(let y = mouse.y;
            goingDown ? y >= this.pointStart.y : y <= this.pointStart.y;
            y += TOOL_RECTANGLE_POINT_DIFF_PX * (goingDown ? -1 : 1)) {
            this.path.addLineToPoint({x: this.pointStart.x, y: y});
        }
        this.path.close();
    }
}

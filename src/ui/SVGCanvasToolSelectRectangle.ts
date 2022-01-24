import { LOG } from "../util/Logging";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { WournalPage } from "./WournalPage";

export class SVGCanvasToolSelectRectangle extends SVGCanvasTool {
    protected cursor = "default";

    private state: "idle" | "selecting" | "moving" | "resizing" = "idle";

    private selectionDisplay: SVGRectElement = null;
    private selectionCoords: {
        startX: number, startY: number, endX: number, endY: number
    };

    constructor(
        protected page: WournalPage,
    ) {
        super(page);
        this.page.toolLayer.style.cursor = this.cursor;
    }

    public onMouseDown(e: MouseEvent): void {
        const mouse = this.page.posForEvent(e);
        switch(this.state) {
            case "idle":
                this.state = "selecting";
                this.selectionCoords = {
                    startX: mouse.x, startY: mouse.y,
                    endX: mouse.x, endY: mouse.y,
                }
                this.selectionDisplay =
                    this.page.toolLayer.ownerDocument.createElementNS(
                        "http://www.w3.org/2000/svg", "rect"
                    );
                this.selectionDisplay.setAttribute("stroke", "darkblue");
                this.selectionDisplay.setAttribute("stroke-opacity", "0.5");
                this.selectionDisplay.setAttribute("fill", "lightblue");
                this.selectionDisplay.setAttribute("fill-opacity", "0.5");
                this.page.toolLayer.appendChild(this.selectionDisplay);
                break;
            case "selecting":
                break;
            case "moving":
            case "resizing":
                LOG.error("not implemented yet")
        }
    }

    public onMouseUp(e: MouseEvent): void {
        switch(this.state) {
            case "idle":
                break;
            case "selecting":
                this.page.toolLayer.removeChild(this.selectionDisplay);
                this.state = "idle";
                break;
            case "moving":
            case "resizing":
                LOG.error("not implemented yet")
        }
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.state === "idle") return;

        const mouse = this.page.posForEvent(e);

        let c = this.selectionCoords;
        c.endX = mouse.x; c.endY = mouse.y;

        let bounds = {
            highX: Math.max(c.endX, c.startX), lowX: Math.min(c.endX, c.startX),
            highY: Math.max(c.endY, c.startY), lowY: Math.min(c.endY, c.startY),
        }

        switch(this.state) {
            case "selecting":
                this.selectionDisplay.setAttribute("x", bounds.lowX.toString());
                this.selectionDisplay.setAttribute("y", bounds.lowY.toString());
                this.selectionDisplay.setAttribute(
                    "width", (bounds.highX - bounds.lowX).toString() + "px",
                );
                this.selectionDisplay.setAttribute(
                    "height", (bounds.highY - bounds.lowY).toString() + "px",
                );
                break;
            case "moving":
            case "resizing":
                LOG.error("not implemented yet")
        }
    }
}

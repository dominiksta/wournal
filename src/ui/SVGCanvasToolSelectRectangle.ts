import { LOG } from "../util/Logging";
import { SVGUtils } from "../util/SVGUtils";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { WournalPage } from "./WournalPage";

export class SVGCanvasToolSelectRectangle extends SVGCanvasTool {
    protected cursor = "default";

    private state: "idle" | "selecting" | "selected" | "moving" | "resizing"
        = "idle";

    private selectionDisplay: SVGRectElement = null;

    /** The initial position after mouse is pressed down */
    private mouseStart: {x: number, y: number};
    /** The current selection rectangle */
    private selectionRect: DOMRect;

    /** The currently selected elements */
    private selectionElems: SVGGraphicsElement[] = [];

    constructor(
        protected page: WournalPage,
    ) {
        super(page);
        this.page.toolLayer.style.cursor = this.cursor;
    }

    public onMouseDown(e: MouseEvent): void {
        const mouse = this.page.globalCoordsToCanvas({x: e.x, y: e.y});
        switch(this.state) {
            case "idle":
                this.state = "selecting";
                this.mouseStart = {x: mouse.x, y: mouse.y}
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
                LOG.error("onMouseDown called in selecting state - " +
                    "state set incorrectly?")
                break;
            case "selected":
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
                this.selectionElems = [];
                for (let el of this.page.getActivePaintLayer().children) {
                    if (!(el instanceof SVGGraphicsElement)) continue;
                    LOG.info(this.selectionRect);
                    LOG.info(el.getBoundingClientRect());
                    if (SVGUtils.rectInRect(
                        this.selectionRect, this.page.globalDOMRectToCanvas(
                            el.getBoundingClientRect())
                    )) {
                        this.selectionElems.push(el);
                    }
                }
                if (this.selectionElems.length == 0) {
                    this.page.toolLayer.removeChild(this.selectionDisplay);
                    this.state = "idle";
                } else {
                    this.selectionDisplay.style.cursor = "move";
                    this.state = "selected";
                }
                break;
            case "selected":
            case "moving":
            case "resizing":
                LOG.error("not implemented yet")
        }
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.state === "idle") return;

        const mouse = this.page.globalCoordsToCanvas({x: e.x, y: e.y});

        this.selectionRect = DOMRect.fromRect({
            x: Math.min(mouse.x, this.mouseStart.x),
            y: Math.min(mouse.y, this.mouseStart.y),
            width: Math.abs(mouse.x - this.mouseStart.x),
            height: Math.abs(mouse.y - this.mouseStart.y),
        });
        let s = this.selectionRect;

        switch(this.state) {
            case "selecting":
                this.selectionDisplay.setAttribute("x", s.left.toString());
                this.selectionDisplay.setAttribute("y", s.top.toString());
                this.selectionDisplay.setAttribute(
                    "width", (s.right - s.left).toString() + "px",
                );
                this.selectionDisplay.setAttribute(
                    "height", (s.bottom - s.top).toString() + "px",
                );
                break;
            case "selected":
            case "moving":
            case "resizing":
                LOG.error("not implemented yet")
        }
    }
}

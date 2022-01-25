import { LOG } from "../util/Logging";
import { SVGUtils } from "../util/SVGUtils";
import { SVGCanvasPath } from "./SVGCanvasPath";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { WournalCanvasElement } from "./WournalCanvasElement";
import { WournalPage } from "./WournalPage";

export class SVGCanvasToolSelectRectangle extends SVGCanvasTool {
    public idleCursor = "default";
    protected toolUseStartPage: WournalPage;

    private state: "idle" | "selecting" | "selected" | "moving" | "resizing"
        = "idle";

    /** A visual display of `selectionRect` */
    private selectionDisplay: SVGRectElement = null;

    /** The initial position after mouse is pressed down (Canvas Coordinates) */
    private mouseStartSelect: {x: number, y: number};
    /** The initial position after mouse is pressed down (Canvas Coordinates) */
    private mouseStartSelected: {x: number, y: number};

    /** The currently selected elements */
    private selectionElems: WournalCanvasElement[] = [];

    public onMouseDown(e: MouseEvent): void {
        const mouse = this.getActivePage().globalCoordsToCanvas({x: e.x, y: e.y});
        switch(this.state) {
            case "idle":
                this.toolUseStartPage = this.getActivePage();
                this.state = "selecting";
                this.mouseStartSelect = {x: mouse.x, y: mouse.y}
                this.selectionDisplay =
                    this.toolUseStartPage.toolLayer.ownerDocument.createElementNS(
                        "http://www.w3.org/2000/svg", "rect"
                    );
                this.selectionDisplay.setAttribute("stroke", "darkblue");
                this.selectionDisplay.setAttribute("stroke-opacity", "0.5");
                this.selectionDisplay.setAttribute("fill", "lightblue");
                this.selectionDisplay.setAttribute("fill-opacity", "0.5");
                this.toolUseStartPage.toolLayer.appendChild(this.selectionDisplay);
                break;
            case "selecting":
                LOG.error("onMouseDown called in selecting state - " +
                    "state set incorrectly?")
                break;
            case "selected":
                if (this.toolUseStartPage === this.getActivePage() &&
                    SVGUtils.pointInRect(mouse, this.currentDisplayRect())) {
                    this.mouseStartSelected = {x: mouse.x, y: mouse.y};
                    this.state = "moving";
                } else {
                    this.toolUseStartPage.toolLayer.removeChild(this.selectionDisplay);
                    this.state = "idle";
                }
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
                this.selectionElems = [];
                const selection = this.currentDisplayRect();
                for (let el of this.toolUseStartPage.getActivePaintLayer().children) {
                    if (!(el instanceof SVGGraphicsElement)) continue;
                    if (SVGUtils.rectInRect(
                        selection, this.toolUseStartPage.globalDOMRectToCanvas(
                            el.getBoundingClientRect())
                    )) {
                        if (el instanceof SVGPathElement)
                            this.selectionElems.push(new SVGCanvasPath(el));
                    }
                }
                if (this.selectionElems.length == 0) {
                    this.toolUseStartPage.toolLayer.removeChild(this.selectionDisplay);
                    this.state = "idle";
                } else {
                    this.selectionDisplay.style.cursor = "move";
                    this.state = "selected";
                }
                break;
            case "selected":
                LOG.error("onMouseUp called in selected state - " +
                    "state set incorrectly?")
                break;
            case "moving":
                for (let el of this.selectionElems)
                    el.currentTransformToInitial();

                const r = this.currentDisplayRect();
                this.selectionDisplay.setAttribute("x", r.left.toString());
                this.selectionDisplay.setAttribute("y", r.top.toString());
                this.selectionDisplay.setAttribute("transform", "");

                this.state = "selected";
                break;
            case "resizing":
                LOG.error("not implemented yet")
        }
    }

    private currentDisplayRect(): DOMRect {
        return this.toolUseStartPage.globalDOMRectToCanvas(
            this.selectionDisplay.getBoundingClientRect()
        );
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.state === "idle") return;

        const mouse = this.toolUseStartPage.globalCoordsToCanvas({x: e.x, y: e.y});

        switch(this.state) {
            case "selecting":
                let s = DOMRect.fromRect({
                    x: Math.min(mouse.x, this.mouseStartSelect.x),
                    y: Math.min(mouse.y, this.mouseStartSelect.y),
                    width: Math.abs(mouse.x - this.mouseStartSelect.x),
                    height: Math.abs(mouse.y - this.mouseStartSelect.y),
                });
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
                break;
            case "moving":
                for (let el of this.selectionElems) {
                    el.resetTransform();
                    let to = {
                        x: mouse.x - this.mouseStartSelected.x,
                        y: mouse.y - this.mouseStartSelected.y
                    }
                    el.translate(to.x, to.y);
                    this.selectionDisplay.setAttribute(
                        "transform", `translate(${to.x} ${to.y})`
                    );
                }
                break;
            case "resizing":
                LOG.error("not implemented yet")
        }
    }
}

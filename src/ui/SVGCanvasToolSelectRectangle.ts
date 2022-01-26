import { DOMUtils } from "../util/DOMUtils";
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
    private selectionDisplay: SelectionDisplay = null;

    /** The initial position after mouse is pressed down (Canvas Coordinates) */
    private mouseStartSelect: {x: number, y: number};
    /** The initial position after mouse is pressed down (Canvas Coordinates) */
    private mouseStartSelected: {x: number, y: number};

    /** The currently selected elements */
    private selectionElems: WournalCanvasElement[] = [];

    public onMouseDown(e: MouseEvent): void {
        if (this.getActivePage() == null) {
            this.selectionDisplay.removeFromDisplay();
            this.state = "idle";
            return;
        }
        const mouse = this.getActivePage().globalCoordsToCanvas({x: e.x, y: e.y});
        switch(this.state) {
            case "idle":
                this.toolUseStartPage = this.getActivePage();
                this.state = "selecting";
                this.mouseStartSelect = {x: mouse.x, y: mouse.y}
                this.selectionDisplay = new SelectionDisplay(this.getActivePage());
                break;
            case "selecting":
                LOG.error("onMouseDown called in selecting state - " +
                    "state set incorrectly?")
                break;
            case "selected":
                if (!(this.toolUseStartPage == this.getActivePage() &&
                    SVGUtils.pointInRect(mouse, this.selectionDisplay.canvasRect()))) {
                    this.selectionDisplay.removeFromDisplay();
                    this.state = "idle";
                    return;
                }
                switch(this.selectionDisplay.lastClicked) {
                    case "main":
                        this.mouseStartSelected = {x: mouse.x, y: mouse.y};
                        this.state = "moving";
                        break;
                    case "top":
                    case "right":
                    case "bottom":
                    case "left":
                        // this.state = "resizing";
                        break;
                }
                break;
            case "moving":
                LOG.error("onMouseDown called in moving state - " +
                    "state set incorrectly?")
                break;
            case "resizing":
                LOG.error("onMouseDown called in moving state - " +
                    "state set incorrectly?")
                break;
        }
    }

    public onMouseUp(e: MouseEvent): void {
        if (this.getActivePage() == null) return;
        switch(this.state) {
            case "idle":
                break;
            case "selecting":
                this.selectionElems = [];
                const selection = this.selectionDisplay.canvasRect();
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
                    this.selectionDisplay.removeFromDisplay();
                    this.state = "idle";
                } else {
                    this.selectionDisplay.setCursorState("move/resize");
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

                const r = this.selectionDisplay.canvasRect();
                this.selectionDisplay.setDimension(r);
                this.selectionDisplay.translate({x: 0, y: 0});

                this.state = "selected";
                break;
            case "resizing":
                LOG.error("not implemented yet")
        }
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.state === "idle") return;
        if (this.getActivePage() == null) return;

        const mouse = this.toolUseStartPage.globalCoordsToCanvas({x: e.x, y: e.y});

        switch(this.state) {
            case "selecting":
                let s = DOMRect.fromRect({
                    x: Math.min(mouse.x, this.mouseStartSelect.x),
                    y: Math.min(mouse.y, this.mouseStartSelect.y),
                    width: Math.abs(mouse.x - this.mouseStartSelect.x),
                    height: Math.abs(mouse.y - this.mouseStartSelect.y),
                });
                this.selectionDisplay.setDimension(s);
                break;
            case "selected":
                break;
            case "moving":
                let to = {
                    x: mouse.x - this.mouseStartSelected.x,
                    y: mouse.y - this.mouseStartSelected.y
                }
                for (let el of this.selectionElems) {
                    el.resetTransform();
                    el.translate(to.x, to.y);
                }
                this.selectionDisplay.translate(to);
                break;
            case "resizing":
                LOG.error("not implemented yet")
        }
    }

    onDeselect(): void {
        this.selectionDisplay.removeFromDisplay();
    }
}


class SelectionDisplay {
    private mainRect: SVGRectElement;

    private edges: {
        top: SVGPathElement,
        right: SVGPathElement,
        bottom: SVGPathElement,
        left: SVGPathElement,
    } = {
        top: null, right: null, bottom: null, left: null,
    }

    private corners: {
        topLeft: SVGPathElement,
        topRight: SVGPathElement,
        bottomRight: SVGPathElement,
        bottomLeft: SVGPathElement,
    } = {
        topLeft: null, topRight: null, bottomRight: null, bottomLeft: null,
    }

    /** The element that was last clicked */
    private _lastClicked: "main" | "top" | "right" | "bottom" | "left" = "main";
    get lastClicked() { return this._lastClicked };

    constructor(private page: WournalPage) {
        this.mainRect = this.page.toolLayer.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg", "rect"
        );
        this.mainRect.setAttribute("stroke", "darkblue");
        this.mainRect.setAttribute("stroke-opacity", "0.5");
        this.mainRect.setAttribute("fill", "lightblue");
        this.mainRect.setAttribute("fill-opacity", "0.5");
        this.mainRect.addEventListener("mousedown", (() => {
            this._lastClicked = "main";
        }).bind(this));

        const createPath = (side: "top" | "right" | "bottom" | "left") => {
            let path = this.page.toolLayer.ownerDocument.createElementNS(
                "http://www.w3.org/2000/svg", "path"
            );
            path.setAttribute("stroke", "black");
            path.setAttribute("stroke-opacity", "0");
            path.setAttribute("stroke-width", "10");

            path.addEventListener("mousedown", (() => {
                this._lastClicked = side;
            }).bind(this));
            return path;
        }
        this.edges.top = createPath("top");
        this.edges.right = createPath("right");
        this.edges.bottom = createPath("bottom");
        this.edges.left = createPath("left");

        for(let el of [
            this.mainRect, this.edges.top, this.edges.right, this.edges.bottom,
            this.edges.left
        ])
            this.page.toolLayer.appendChild(el);
    }

    /** Remove all elements from given `page` */
    removeFromDisplay() {
        for(let el of [
            this.mainRect, this.edges.top, this.edges.right, this.edges.bottom,
            this.edges.left
        ])
            DOMUtils.maybeRemoveChild(this.page.toolLayer, el);
    }

    setCursorState(cursor: "move/resize" | "default") {
        switch(cursor) {
            case "move/resize":
                this.mainRect.style.cursor = "move";
                this.edges.top.style.cursor = "n-resize";
                this.edges.right.style.cursor = "e-resize";
                this.edges.bottom.style.cursor = "n-resize";
                this.edges.left.style.cursor = "e-resize";
                break;
            case "default":
                this.mainRect.style.cursor = "default";
                this.edges.top.style.cursor = "default";
                this.edges.right.style.cursor = "default";
                this.edges.bottom.style.cursor = "default";
                this.edges.left.style.cursor = "default";
                break;
        }
    }

    /** Set the dimension to DOMRect r */
    setDimension(r: DOMRect) {
        this.mainRect.setAttribute("x", r.x.toString());
        this.mainRect.setAttribute("y", r.y.toString());
        this.mainRect.setAttribute("width", r.width.toString() + "px");
        this.mainRect.setAttribute("height", r.height.toString() + "px");

        this.edges.top.setAttribute(
            "d", `M${r.x} ${r.y} L${r.x + r.width} ${r.y}`
        );
        this.edges.right.setAttribute(
            "d", `M${r.x + r.width} ${r.y} L${r.x + r.width} ${r.y + r.height}`
        );
        this.edges.bottom.setAttribute(
            "d", `M${r.x} ${r.y + r.height} L${r.x + r.width} ${r.y + r.height}`
        );
        this.edges.left.setAttribute(
            "d", `M${r.x} ${r.y} L${r.x} ${r.y + r.height}`
        );
    }

    /** Get main bounding client rect */
    canvasRect(): DOMRect {
        return this.page.globalDOMRectToCanvas(
            this.mainRect.getBoundingClientRect()
        );
    }

    /** Technically we could use setPosition, but this should be a bit faster */
    translate(pos: {x: number, y: number}): void {
        this.mainRect.setAttribute("transform", `translate(${pos.x} ${pos.y})`);
    }
}

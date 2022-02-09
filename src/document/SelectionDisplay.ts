import { DOMUtils } from "../util/DOMUtils";
import { WournalPage } from "./WournalPage";

export class SelectionDisplay {
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
        // TODO: slightly too large because of edges
        return this.page.globalDOMRectToCanvas(
            this.mainRect.getBoundingClientRect()
        );
    }

    /** Technically we could use setPosition, but this should be a bit faster */
    translate(pos: {x: number, y: number}): void {
        this.mainRect.setAttribute("transform", `translate(${pos.x} ${pos.y})`);
    }
}

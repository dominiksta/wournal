import { DOMUtils } from "../util/DOMUtils";
import { WournalPage } from "./WournalPage";

const EDGE_WIDTH = 10;
const MAIN_STROKE_WIDTH = 1;

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
        this.mainRect.setAttribute("stroke-width", MAIN_STROKE_WIDTH.toString());
        this.mainRect.setAttribute("fill", "lightblue");
        this.mainRect.setAttribute("fill-opacity", "0.5");
        this.mainRect.addEventListener("mousedown", () => {
            this._lastClicked = "main";
        });

        const createPath = (side: "top" | "right" | "bottom" | "left") => {
            let path = this.page.toolLayer.ownerDocument.createElementNS(
                "http://www.w3.org/2000/svg", "path"
            );
            path.setAttribute("stroke", "black");
            path.setAttribute("stroke-opacity", "0");
            path.setAttribute("stroke-width", EDGE_WIDTH.toString());

            path.addEventListener("mousedown", () => {
                this._lastClicked = side;
            });
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
    getMainRect(): DOMRect {
        let mainRect = this.mainRect.getBoundingClientRect();
        return this.page.globalDOMRectToCanvas(DOMRect.fromRect({
            x: mainRect.x + MAIN_STROKE_WIDTH / 2,
            y: mainRect.y + MAIN_STROKE_WIDTH / 2,
            width: mainRect.width - MAIN_STROKE_WIDTH,
            height: mainRect.height - MAIN_STROKE_WIDTH,
        }));
    }

    /** Get the "hitbox" of the entire selection display (including the edges) */
    hitbox(): DOMRect {
        let mainRect = this.mainRect.getBoundingClientRect();
        return this.page.globalDOMRectToCanvas(DOMRect.fromRect({
            x: mainRect.x - EDGE_WIDTH / 2,
            y: mainRect.y - EDGE_WIDTH / 2,
            width: mainRect.width + EDGE_WIDTH,
            height: mainRect.height + EDGE_WIDTH,
        }));
    }

    /** Technically we could use setPosition, but this should be a bit faster */
    translate(pos: {x: number, y: number}): void {
        this.mainRect.setAttribute("transform", `translate(${pos.x} ${pos.y})`);
    }
}

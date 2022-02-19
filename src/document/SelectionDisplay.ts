import { DOMUtils } from "../util/DOMUtils";
import { LOG } from "../util/Logging";
import { SVGUtils } from "../util/SVGUtils";
import { CanvasElement, CanvasElementData } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { UndoStack } from "./UndoStack";
import { WournalPage } from "./WournalPage";

const EDGE_WIDTH = 10;
const MAIN_STROKE_WIDTH = 1;

export class CanvasSelection {
    private _page: WournalPage;
    get page() { return this._page; }

    private state : "idle" | "resizing" | "moving" = "idle";
    get currentlyInteracting(): boolean {
        return this.state === "resizing" || this.state === "moving";
    }

    private mouseBeforeMove: {x: number, y: number};
    private rectBeforeResize: DOMRect;

    private mainRect: SVGRectElement = null;

    private edges: {
        top: SVGPathElement,
        right: SVGPathElement,
        bottom: SVGPathElement,
        left: SVGPathElement,
    } = {
        top: null, right: null, bottom: null, left: null,
    }

    // private corners: {
    //     topLeft: SVGPathElement,
    //     topRight: SVGPathElement,
    //     bottomRight: SVGPathElement,
    //     bottomLeft: SVGPathElement,
    // } = {
    //     topLeft: null, topRight: null, bottomRight: null, bottomLeft: null,
    // }

    /** The element that was last clicked */
    private _lastClicked: "main" | "top" | "right" | "bottom" | "left" = "main";
    get lastClicked() { return this._lastClicked };

    private _selection: {el: CanvasElement, savedData: CanvasElementData}[] = [];
    get selection(): CanvasElement[] { return this._selection.map(e => e.el); }

    constructor(private undoStack: UndoStack) { }

    public init(page: WournalPage) {
        this._selection = [];
        this._page = page;
        this.clear();
        this.mainRect = this._page.toolLayer.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg", "rect"
        );
        this.mainRect.setAttribute("stroke", "darkblue");
        this.mainRect.setAttribute("stroke-opacity", "0.5");
        this.mainRect.setAttribute("stroke-width", MAIN_STROKE_WIDTH.toString());
        this.mainRect.setAttribute("fill", "lightblue");
        this.mainRect.setAttribute("fill-opacity", "0.5");
        this.mainRect.addEventListener("mousedown", (e) => {
            this._lastClicked = "main";
        });
        this.mainRect.style.cursor = "move";

        const createPath = (side: "top" | "right" | "bottom" | "left") => {
            let path = this._page.toolLayer.ownerDocument.createElementNS(
                "http://www.w3.org/2000/svg", "path"
            );
            path.setAttribute("stroke", "black");
            path.setAttribute("stroke-opacity", "0");
            path.setAttribute("stroke-width", EDGE_WIDTH.toString());

            path.addEventListener("mousedown", (e) => {
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
            this._page.toolLayer.appendChild(el);

        this.setCursorState("creating");
    }

    private setCursorState(state: "idle" | "creating") {
        switch(state) {
            case "creating":
                this.edges.top.style.cursor = "crosshair";
                this.edges.right.style.cursor = "crosshair";
                this.edges.bottom.style.cursor = "crosshair";
                this.edges.left.style.cursor = "crosshair";
                break;
            case "idle":
                this.edges.top.style.cursor = "n-resize";
                this.edges.right.style.cursor = "e-resize";
                this.edges.bottom.style.cursor = "n-resize";
                this.edges.left.style.cursor = "e-resize";
                break;
        }
    }

    /** Remove all elements from given `page` */
    public clear() {
        this._selection = [];
        this.notifySelectionAvailable();
        for(let el of [
            this.mainRect, this.edges.top, this.edges.right, this.edges.bottom,
            this.edges.left
        ])
            if (el !== null) DOMUtils.maybeRemoveChild(this._page.toolLayer, el);
    }

    public onMouseDown(e: MouseEvent): void {
        e.stopPropagation();
        const mouse = this.page.globalCoordsToCanvas(e);

        switch(this.state) {
            case "idle":
                for (let s of this._selection) s.savedData = s.el.getData();
                if (this._lastClicked === "main") {
                    this.mouseBeforeMove = { x: mouse.x, y: mouse.y };
                    this.state = "moving";
                } else {
                    this.rectBeforeResize = DOMRect.fromRect(this.getMainRect());
                    this.state = "resizing";
                }
                break;
            case "moving":
            case "resizing":
                LOG.error(`onMouseDown called in ${this.state} state`)
                break;
        }
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.state === "idle") return;
        e.stopPropagation();
        const mouse = this.page.globalCoordsToCanvas(e);

        switch(this.state) {
            case "moving":
                let to = {
                    x: mouse.x - this.mouseBeforeMove.x,
                    y: mouse.y - this.mouseBeforeMove.y
                }
                for (let s of this._selection) {
                    s.el.resetTransform();
                    s.el.translate(to.x, to.y);
                }
                this.translate(to);
                break;
            case "resizing":
                const bef = this.rectBeforeResize;
                const aft = DOMRect.fromRect(this.rectBeforeResize);
                const diff = {
                    left: mouse.x - bef.left,
                    right: mouse.x - bef.right,
                    top: mouse.y - bef.top,
                    bottom: mouse.y - bef.bottom,
                }
                for (let s of this._selection) s.el.resetTransform();
                let resizeFactor = 0;
                switch (this._lastClicked) {
                    case "main":
                        LOG.error("lastClicked = main in resizing state");
                        return;
                    case "top":
                        aft.y += diff.top;
                        aft.height -= diff.top;
                        resizeFactor = (bef.bottom - mouse.y) / (bef.bottom - bef.top);
                        break;
                    case "right":
                        aft.width += diff.right;
                        resizeFactor = (mouse.x - bef.left) / (bef.right - bef.left);
                        break;
                    case "bottom":
                        aft.height += diff.bottom;
                        resizeFactor = (mouse.y - bef.top) / (bef.bottom - bef.top);
                        break;
                    case "left":
                        aft.x += diff.left;
                        aft.width -= diff.left;
                        resizeFactor = (bef.right - mouse.x) / (bef.right - bef.left);
                        break;
                }
                for (let s of this._selection)
                    s.el.scaleInPlace(bef, this._lastClicked, resizeFactor);
                this.setDimension(aft);
                break;
        }
    }

    public onMouseUp(e: MouseEvent): void {
        if (this.state === "idle") return;
        e.stopPropagation();
        switch(this.state) {
            case "moving":
            case "resizing":
                let undo = [];
                for (let s of this._selection) {
                    s.el.writeTransform();
                    undo.push({
                        el: s.el.svgElem, dataBefore: s.savedData,
                        dataAfter: s.el.getData()
                    })
                }
                this.undoStack.push(new UndoActionCanvasElements(
                    null, undo, null
                ));
                this.setDimension(this.getMainRect());
                this.translate({x: 0, y: 0});

                this.state = "idle";
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
    private getMainRect(): DOMRect {
        let mainRect = this.mainRect.getBoundingClientRect();
        return this._page.globalDOMRectToCanvas(DOMRect.fromRect({
            x: mainRect.x + MAIN_STROKE_WIDTH / 2,
            y: mainRect.y + MAIN_STROKE_WIDTH / 2,
            width: mainRect.width - MAIN_STROKE_WIDTH,
            height: mainRect.height - MAIN_STROKE_WIDTH,
        }));
    }

    /** Get the "hitbox" of the entire selection display (including the edges) */
    public hitbox(): DOMRect {
        let mainRect = this.mainRect.getBoundingClientRect();
        return this._page.globalDOMRectToCanvas(DOMRect.fromRect({
            x: mainRect.x - EDGE_WIDTH / 2,
            y: mainRect.y - EDGE_WIDTH / 2,
            width: mainRect.width + EDGE_WIDTH,
            height: mainRect.height + EDGE_WIDTH,
        }));
    }

    /** Technically we could use setPosition, but this should be a bit faster */
    private translate(pos: {x: number, y: number}): void {
        this.mainRect.setAttribute("transform", `translate(${pos.x} ${pos.y})`);
    }

    public setSelectionFromElements(page: WournalPage, els: CanvasElement[]) {
        this.init(page);
        let boundingRect = els[0].svgElem.getBoundingClientRect();
        for (let i = 1; i < els.length; i++) {
            boundingRect = SVGUtils.boundingRectForTwo(
                boundingRect, els[i].svgElem.getBoundingClientRect()
            );
        }
        this.setDimension(page.globalDOMRectToCanvas(boundingRect));
        this._selection = els.map(e => { return { el: e, savedData: e.getData() } });
        this.setCursorState("idle");
        this.notifySelectionAvailable();
    }

    public setSelectionFromCurrentRect() {
        this.setCursorState("idle");
        const selRect = this.getMainRect();
        for (let el of this.page.getActivePaintLayer().children) {
            if (!(el instanceof SVGGraphicsElement)) continue;
            if (SVGUtils.rectInRect(
                selRect, this.page.globalDOMRectToCanvas(el.getBoundingClientRect())
            )) {
                let wournalEl = CanvasElementFactory.fromSvgElem(el);
                this._selection.push(
                    { savedData: wournalEl.getData(), el: wournalEl }
                );
            }
        }
        this.notifySelectionAvailable();
    }

    private notifySelectionAvailable() {
        this.page?.notifySelectionAvailable(this._selection.length !== 0);
    }
}

import { LOG } from "../util/Logging";
import { SVGUtils } from "../util/SVGUtils";
import { SelectionDisplay } from "./SelectionDisplay";
import { SVGCanvasPath } from "./SVGCanvasPath";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { WournalCanvasElement, WournalCanvasElementData } from "./WournalCanvasElement";
import { WournalCanvasElementFactory } from "./WournalCanvasElementFactory";
import { WournalPage } from "./WournalPage";

export class SVGCanvasToolSelectRectangle extends SVGCanvasTool {
    public idleCursor = "default";
    protected toolUseStartPage: WournalPage;

    private state: "idle" | "selecting" | "selected" | "moving" | "resizing"
        = "idle";

    /** A visual display of `selectionRect` */
    private selectionDisplay: SelectionDisplay = null;

    /** Stores some mouse canvas coordinates needed for calculations */
    private savedMouse: {
        beforeSelect: {x: number, y: number},
        beforeMove: {x: number, y: number}
    } = {
        beforeSelect: null, beforeMove: null
    }

    private savedSelectionRect: {
        beforeResize: DOMRect,
    } = {
        beforeResize: null,
    }

    /** The currently selected elements */
    private selectionElems: {
        savedData: WournalCanvasElementData, el: WournalCanvasElement
    }[] = [];

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
                this.savedMouse.beforeSelect = {x: mouse.x, y: mouse.y}
                this.selectionDisplay = new SelectionDisplay(this.getActivePage());
                this.getActivePage().toolLayer.style.cursor = "crosshair";
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

                for (let el of this.selectionElems)
                    el.savedData = el.el.getData();

                switch(this.selectionDisplay.lastClicked) {
                    case "main":
                        this.savedMouse.beforeMove = {x: mouse.x, y: mouse.y};
                        this.state = "moving";
                        break;
                    case "top":
                    case "right":
                    case "bottom":
                    case "left":
                        this.savedSelectionRect.beforeResize =
                            DOMRect.fromRect(this.selectionDisplay.canvasRect());
                        this.state = "resizing";
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
        this.getActivePage().toolLayer.style.cursor = this.idleCursor;
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
                        let wournalEl = WournalCanvasElementFactory.fromSvgElem(el);
                        this.selectionElems.push(
                            { savedData: wournalEl.getData(), el: wournalEl }
                        );
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
            case "resizing":
                let undo = [];
                for (let el of this.selectionElems) {
                    el.el.writeTransform();
                    undo.push({
                        el: el.el.svgElem, dataBefore: el.savedData,
                        dataAfter: el.el.getData()
                    })
                }
                this.undoStack.push(new UndoActionCanvasElements(
                    null, undo, null
                ));


                const r = this.selectionDisplay.canvasRect();
                this.selectionDisplay.setDimension(r);
                this.selectionDisplay.translate({x: 0, y: 0});

                this.state = "selected";
                break;
        }
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.state === "idle") return;
        if (this.getActivePage() == null) return;

        const mouse = this.toolUseStartPage.globalCoordsToCanvas({x: e.x, y: e.y});

        switch(this.state) {
            case "selecting":
                let s = DOMRect.fromRect({
                    x: Math.min(mouse.x, this.savedMouse.beforeSelect.x),
                    y: Math.min(mouse.y, this.savedMouse.beforeSelect.y),
                    width: Math.abs(mouse.x - this.savedMouse.beforeSelect.x),
                    height: Math.abs(mouse.y - this.savedMouse.beforeSelect.y),
                });
                this.selectionDisplay.setDimension(s);
                break;
            case "selected":
                break;
            case "moving":
                let to = {
                    x: mouse.x - this.savedMouse.beforeMove.x,
                    y: mouse.y - this.savedMouse.beforeMove.y
                }
                for (let el of this.selectionElems) {
                    el.el.resetTransform();
                    el.el.translate(to.x, to.y);
                }
                this.selectionDisplay.translate(to);
                break;
            case "resizing":
                const before = this.savedSelectionRect.beforeResize;
                const after = DOMRect.fromRect(this.savedSelectionRect.beforeResize);
                const diff = {
                    left: mouse.x - before.left,
                    right: mouse.x - before.right,
                    top: mouse.y - before.top,
                    bottom: mouse.y - before.bottom,
                }
                for (let el of this.selectionElems)
                    el.el.resetTransform();
                let resizeFactor = 0;
                switch (this.selectionDisplay.lastClicked) {
                    case "main":
                        LOG.error("lastClicked = main in resizing state");
                        return;
                    case "top":
                        after.y += diff.top;
                        after.height -= diff.top;
                        resizeFactor = (before.bottom - mouse.y) /
                            (before.bottom - before.top);
                        break;
                    case "right":
                        after.width += diff.right;
                        resizeFactor = (mouse.x - before.left) /
                            (before.right - before.left);
                        break;
                    case "bottom":
                        after.height += diff.bottom;
                        resizeFactor = (mouse.y - before.top) /
                            (before.bottom - before.top);
                        break;
                    case "left":
                        after.x += diff.left;
                        after.width -= diff.left;
                        resizeFactor = (before.right - mouse.x) /
                            (before.right - before.left);
                        break;
                }
                for (let el of this.selectionElems)
                    el.el.scaleInPlace(
                        before, this.selectionDisplay.lastClicked, resizeFactor
                    );
                this.selectionDisplay.setDimension(after);
                break;
        }
    }

    onDeselect(): void {
        if (this.selectionDisplay)
            this.selectionDisplay.removeFromDisplay();
    }
}

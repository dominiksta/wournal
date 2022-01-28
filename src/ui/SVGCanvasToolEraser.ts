import { WournalPage } from "./WournalPage";
import { SVGCanvasPath } from "./SVGCanvasPath";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { SVGUtils } from "../util/SVGUtils";

export class SVGCanvasToolEraser extends SVGCanvasTool {

    /** The (configurable) size of the rectangular eraser tip. */
    public size: number = 5;

    private erasing: boolean = false;
    protected toolUseStartPage: WournalPage = null;

    public idleCursor = "default";

    public onMouseDown(e: MouseEvent): void {
        this.toolUseStartPage = this.getActivePage();
        if (this.toolUseStartPage === null) return;
        this.erasing = true;
        this.eraseTouched(e);
    }

    public onMouseUp(e: MouseEvent): void {
        this.erasing = false;
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.toolUseStartPage === null || !this.erasing) return;

        this.eraseTouched(e);
    }

    private eraseTouched(e: MouseEvent) {
        const mouse = this.toolUseStartPage.globalCoordsToCanvas(e);

        const eraserRect = DOMRect.fromRect({
            x: mouse.x - this.size / 2,
            y: mouse.y - this.size / 2,
            height: this.size,
            width: this.size,
        });
        for (let node of this.toolUseStartPage.activePaintLayer.children) {
            const elRect = this.toolUseStartPage.globalDOMRectToCanvas(
                node.getBoundingClientRect());
            // Ignore non-path elements. When text-boxes are added in the
            // future, they should not be affected by erasers.
            if (!(node instanceof SVGPathElement)) continue;

            // pre-select elements where mouse is at least in bounding client
            // rect
            if (SVGUtils.rectInRect(elRect, eraserRect)) {
                let path = new SVGCanvasPath(node);
                // SVGUtils.tmpDisplayRect(
                //     eraserRect, this.toolUseStartPage.activePaintLayer,
                //     500, "blue"
                // );
                // check wether mouse is actually on path
                if (path.isRectTouchingPath(eraserRect))
                    this.toolUseStartPage.activePaintLayer.removeChild(node);
            }
        }
    }


    onDeselect(): void {}
}

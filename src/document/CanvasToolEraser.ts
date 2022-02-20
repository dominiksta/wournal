import { SVGUtils } from "../util/SVGUtils";
import { CanvasPath } from "./CanvasPath";
import { CanvasTool } from "./CanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { Wournal } from "./Wournal";
import { WournalPage } from "./WournalPage";

export class CanvasToolEraser extends CanvasTool {


    private erasing: boolean = false;
    protected toolUseStartPage: WournalPage = null;
    /**
     * Build up an array of undo actions to merge into one big undo action on
     * mouse up.
     */
    private currentUndo: UndoActionCanvasElements[] = [];

    public idleCursor = "default";

    constructor() {
        super();

        // To actually really reflect the area to be erased, we would have to
        // somehow listen to zoom events and change the cursor size
        // accordingly. Considering that xournal, xournal++ and pdf annotator
        // all don't do that and have constant cursor sizes for their erasers,
        // this should be fine for now.
        this.idleCursor =
            `url('data:image/svg+xml;utf8,` +
            `<svg height="${Wournal.currToolConf.CanvasToolEraser.size}" ` +
            `     width="${Wournal.currToolConf.CanvasToolEraser.size}" ` +
            `     xmlns="http://www.w3.org/2000/svg">` +
            `  <rect x="0" y="0" ` +
            `        height="${Wournal.currToolConf.CanvasToolEraser.size}" ` +
            `        width="${Wournal.currToolConf.CanvasToolEraser.size}" ` +
            `        stroke="black" stroke-width="2" fill="white"></rect>` +
            `</svg>') ${Wournal.currToolConf.CanvasToolEraser.size / 2} ` +
            `${Wournal.currToolConf.CanvasToolEraser.size / 2}, auto`;
    }

    public onMouseDown(e: MouseEvent): void {
        this.toolUseStartPage = this.getActivePage();
        if (this.toolUseStartPage === null) return;
        this.currentUndo = [];
        this.erasing = true;
        this.eraseTouched(e);
    }

    public onMouseUp(e: MouseEvent): void {
        if (this.currentUndo.length !== 0) {
            let finalUndo = new UndoActionCanvasElements(null, null, null);
            for (let i = this.currentUndo.length - 1; i >= 0; i--)
                finalUndo.add(this.currentUndo[i]);

            this.undoStack.push(finalUndo);
        }

        this.erasing = false;
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.toolUseStartPage === null || !this.erasing) return;

        this.eraseTouched(e);
    }

    private eraseTouched(e: MouseEvent) {
        const mouse = this.toolUseStartPage.globalCoordsToCanvas(e);

        const eraserRect = DOMRect.fromRect({
            x: mouse.x - Wournal.currToolConf.CanvasToolEraser.size / 2,
            y: mouse.y - Wournal.currToolConf.CanvasToolEraser.size / 2,
            height: Wournal.currToolConf.CanvasToolEraser.size,
            width: Wournal.currToolConf.CanvasToolEraser.size,
        });
        for (let node of this.toolUseStartPage.activePaintLayer.children) {
            const elRect = this.toolUseStartPage.globalDOMRectToCanvas(
                node.getBoundingClientRect());
            // Ignore non-path elements. When text-boxes are added in the
            // future, they should not be affected by erasers.
            if (!(node instanceof SVGPathElement)) continue;

            // pre-select elements where mouse is at least in bounding client
            // rect
            if (SVGUtils.rectIntersect(elRect, eraserRect)) {
                let path = new CanvasPath(node);
                // SVGUtils.tmpDisplayRect(
                //     eraserRect, this.toolUseStartPage.activePaintLayer,
                //     500, "blue"
                // );
                // path.pulsePoints();

                // check wether mouse is actually on path
                if (Wournal.currToolConf.CanvasToolEraser.eraseStrokes) {
                    if (path.isTouchingRect(eraserRect)) {
                        this.currentUndo.push(
                            new UndoActionCanvasElements([node], null, null)
                        );
                        this.toolUseStartPage.activePaintLayer
                            .removeChild(node);
                    }
                } else {
                    this.currentUndo.push(path.eraseRect(eraserRect));
                }
            }
        }
    }


    onDeselect(): void {}
}

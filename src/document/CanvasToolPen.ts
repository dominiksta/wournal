import { WournalPage } from "./WournalPage";
import { CanvasPath } from "./CanvasPath";
import { CanvasTool } from "./CanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { Wournal } from "./Wournal";

export class CanvasToolPen extends CanvasTool {

    /** Buffer for smoothing. Contains the last positions of the mouse cursor */
    private mouseBuffer: {x: number, y: number}[] = [];

    protected toolUseStartPage: WournalPage;

    /** The svg path for the current line */
    private path: CanvasPath = null;

    public idleCursor = "url('res/custom/pen.svg'), auto";

    public onMouseDown(e: MouseEvent): void {
        this.toolUseStartPage = this.getActivePage();
        if (this.toolUseStartPage === null) return;

        this.path = CanvasPath.fromNewPath(this.toolUseStartPage.display.ownerDocument);
        this.path.setLineCap("round");
        this.mouseBuffer = [];
        var pt = this.toolUseStartPage.globalCoordsToCanvas({x: e.x, y: e.y});
        this.appendToBuffer(pt);
        this.path.startAt(pt);
        this.toolUseStartPage.getActivePaintLayer().appendChild(this.path.svgElem);
    }

    public onMouseUp(e: MouseEvent): void {
        if (this.path) {
            this.undoStack.push(new UndoActionCanvasElements(
                null, null, [this.path.svgElem]
            ));
            this.path = null;
        }
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.path) {
            this.appendToBuffer(
                this.toolUseStartPage.globalCoordsToCanvas({x: e.x, y: e.y})
            );
            this.updateSvgPath();
        }
    }

    /** Calculate the average point, starting at offset in the buffer */
    private getAveragePoint(offset: number): {x: number, y: number} | null {
        var len = this.mouseBuffer.length;
        if (len % 2 === 1 || len >= Wournal.CONF.pen.mouseBufferSize) {
            var totalX = 0;
            var totalY = 0;
            var pt, i;
            var count = 0;
            for (i = offset; i < len; i++) {
                count++;
                pt = this.mouseBuffer[i];
                totalX += pt.x;
                totalY += pt.y;
            }
            return {
                x: totalX / count,
                y: totalY / count
            };
        }
        return null;
    }

    private appendToBuffer(pt: {x: number, y: number}) {
        this.mouseBuffer.push(pt);
        while (this.mouseBuffer.length > Wournal.CONF.pen.mouseBufferSize) {
            this.mouseBuffer.shift();
        }
    }

    private updateSvgPath() {
        var pt = this.getAveragePoint(0);

        if (pt) {
            // Get the smoothed part of the path that will not change
            this.path.addLineToPoint(pt);

            // Get the last part of the path (close to the current mouse position)
            // This part will change if the mouse moves again
            var tipStroke = [];
            for (var offset = 2; offset < this.mouseBuffer.length; offset += 2) {
                pt = this.getAveragePoint(offset);
                tipStroke.push(pt);
            }
            this.path.setTipStroke(tipStroke);
        }
    }

    onDeselect(): void {}
}
import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { FileUtils } from "../util/FileUtils";
import { CanvasImage, CanvasImageData } from "./CanvasImage";
import { CanvasTool } from "./CanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { WournalPage } from "./WournalPage";

export class CanvasToolImage extends CanvasTool {

    public override idleCursor = "default";
    protected override toolUseStartPage: WournalPage;

    public override setColor(color: string): void { }
    public override getColor(): string | "" { return "" }
    public override setStrokeWidth(width: CanvasToolStrokeWidth): void { }
    public override getStrokeWidth(): CanvasToolStrokeWidth { return "none" }

    public override onDeselect(): void { }
    public override onMouseMove(e: MouseEvent) { }
    public override onMouseUp(e: MouseEvent) { }

    public override async onMouseDown(e: MouseEvent) {
        this.toolUseStartPage = this.getActivePage();
        if (this.toolUseStartPage === null) return;

        const mouse = this.toolUseStartPage.globalCoordsToCanvas(e);
        const file = await FileUtils.promptReadFileAsUtf8String(
            "dataUrl", ["png", "jpg", "jpeg"],
            ["image/png", "image/jpg", "image/jpeg"]
        );
        const dimensions = await FileUtils.imageDimensionsForDataUrl(file.content);

        let newEl = CanvasImage.fromNewElement(
            this.toolUseStartPage.toolLayer.ownerDocument);
        newEl.setData(new CanvasImageData(
            file.content, DOMRect.fromRect({
                x: mouse.x, y: mouse.y,
                width: dimensions.width, height: dimensions.height
            })
        ));

        this.toolUseStartPage.activePaintLayer.appendChild(newEl.svgElem);
        this.selection.setSelectionFromElements(this.toolUseStartPage, [newEl]);
        this.undoStack.push(new UndoActionCanvasElements(
            null, null, [newEl.svgElem]
        ));
    }

}

import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { FileUtils } from "../util/FileUtils";
import { CanvasImage } from "./CanvasImage";
import { CanvasTool } from "./CanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { WournalPage } from "./WournalPage";

export class CanvasToolImage extends CanvasTool {

  public override idleCursor = "default";
  protected override toolUseStartPage: WournalPage;

  public override canSetStrokeWidth = false;
  public override canSetColor = false;

  public override onDeselect(): void { }
  public override onMouseMove(e: MouseEvent) { }
  public override onMouseUp(e: MouseEvent) { }

  public override async onMouseDown(e: MouseEvent) {
    this.toolUseStartPage = this.activePage.value;
    if (this.toolUseStartPage === null) return;

    const mouse = this.toolUseStartPage.globalCoordsToCanvas(e);
    const file = await FileUtils.promptReadFileAsUtf8String(
      "dataUrl", ["png", "jpg", "jpeg"],
      ["image/png", "image/jpg", "image/jpeg"]
    );
    const dimensions = await FileUtils.imageDimensionsForDataUrl(file.content);

    let newEl = CanvasImage.fromNewElement();
    newEl.deserialize({
      name: 'Image',
      dataUrl: file.content, rect: {
        x: mouse.x, y: mouse.y,
        width: dimensions.width, height: dimensions.height
      }
    });

    this.toolUseStartPage.activePaintLayer.appendChild(newEl.svgElem);
    this.selection.setSelectionFromElements(this.toolUseStartPage, [newEl]);
    this.undoStack.push(new UndoActionCanvasElements(
      null, null, [newEl.svgElem]
    ));
  }

}

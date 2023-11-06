import { WournalPage } from "./WournalPage";
import { CanvasPath } from "./CanvasPath";
import { CanvasTool } from "./CanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { Wournal } from "./Wournal";
import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";

const TOOL_RECTANGLE_POINT_DIFF_PX = 5;

export class CanvasToolRectangle extends CanvasTool {
  public idleCursor = "crosshair";
  protected toolUseStartPage: WournalPage;

  private path: CanvasPath = null;
  private pointStart: { x: number, y: number } = null;

  public override setStrokeWidth(width: CanvasToolStrokeWidth): void {
    Wournal.currToolConf.CanvasToolRectangle.strokeWidth = width;
  }
  public override getStrokeWidth(): CanvasToolStrokeWidth {
    return Wournal.currToolConf.CanvasToolRectangle.strokeWidth;
  }
  private actualStrokeWidth(): number {
    const confWidth = Wournal.currToolConf.CanvasToolRectangle.strokeWidth;
    if (confWidth === "fine") return 1;
    if (confWidth === "medium") return 2;
    if (confWidth === "thick") return 5;
    if (confWidth === "none") throw new Error("'none' strokeWidth for rect");
  }

  public override setColor(color: string): void {
    Wournal.currToolConf.CanvasToolRectangle.color = color;
  }
  public override getColor(): string | "" {
    return Wournal.currToolConf.CanvasToolRectangle.color;
  }

  public onMouseDown(e: MouseEvent): void {
    this.toolUseStartPage = this.getActivePage();
    if (this.toolUseStartPage === null) return;

    this.path = CanvasPath.fromNewPath(this.toolUseStartPage.display.ownerDocument);
    this.path.setActualStrokeWidth(this.actualStrokeWidth());
    this.path.setColor(Wournal.currToolConf.CanvasToolRectangle.color);
    this.pointStart = this.toolUseStartPage.globalCoordsToCanvas({ x: e.x, y: e.y })
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
    if (this.path === null) return;
    this.path.startAt(this.pointStart);
    const mouse = this.toolUseStartPage.globalCoordsToCanvas({ x: e.x, y: e.y });

    const goingRight = mouse.x > this.pointStart.x;
    const goingDown = mouse.y > this.pointStart.y;

    // When the path for the rectangle is closed at the end of this method,
    // it would leave a little empty bit at the start without compensating
    // for the stroke width either at the start or end of the rectangle
    // path. So we need to compensate.
    const cmpStart = this.path.getStrokeWidth() / 2;

    // top
    for (let x = this.pointStart.x + (goingRight ? -cmpStart : cmpStart);
      goingRight ? x <= mouse.x : x >= mouse.x;
      x += TOOL_RECTANGLE_POINT_DIFF_PX * (goingRight ? 1 : -1)) {
      this.path.addLineToPoint({ x: x, y: this.pointStart.y });
    }
    // right
    for (let y = this.pointStart.y;
      goingDown ? y <= mouse.y : y >= mouse.y;
      y += TOOL_RECTANGLE_POINT_DIFF_PX * (goingDown ? 1 : -1)) {
      this.path.addLineToPoint({ x: mouse.x, y: y });
    }
    // bottom
    for (let x = mouse.x;
      goingRight ? x >= this.pointStart.x : x <= this.pointStart.x;
      x += TOOL_RECTANGLE_POINT_DIFF_PX * (goingRight ? -1 : 1)) {
      this.path.addLineToPoint({ x: x, y: mouse.y });
    }
    // left
    for (let y = mouse.y;
      goingDown ? y >= this.pointStart.y : y <= this.pointStart.y;
      y += TOOL_RECTANGLE_POINT_DIFF_PX * (goingDown ? -1 : 1)) {
      this.path.addLineToPoint({ x: this.pointStart.x, y: y });
    }
    this.path.close();
  }

  onDeselect(): void { }
}

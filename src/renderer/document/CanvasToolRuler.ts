import { CanvasPath } from "./CanvasPath";
import { CanvasTool } from "./CanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { WournalPage } from "./WournalPage";

const TOOL_RECTANGLE_POINT_DIFF_PX = 5;

export class CanvasToolRuler extends CanvasTool {
  private get conf() {
    return this.activePage.value.doc.toolConfig.value.CanvasToolRuler
  };

  public idleCursor = "crosshair";
  protected toolUseStartPage: WournalPage;

  private path: CanvasPath = null;
  private pointStart: { x: number, y: number } = null;

  public override canSetStrokeWidth = true;
  public override canSetColor = true;

  private actualStrokeWidth(): number {
    const confWidth = this.conf.strokeWidth;
    if (confWidth === "fine") return 1;
    if (confWidth === "medium") return 2;
    if (confWidth === "thick") return 5;
  }

  public onMouseDown(e: MouseEvent): void {
    this.toolUseStartPage = this.activePage.value;
    if (this.toolUseStartPage === null) return;

    this.path = CanvasPath.fromNewPath();
    this.path.setActualStrokeWidth(this.actualStrokeWidth());
    this.path.setColor(this.conf.color);
    this.pointStart = this.toolUseStartPage.globalCoordsToCanvas({ x: e.x, y: e.y })
    this.toolUseStartPage.activePaintLayer.appendChild(this.path.svgElem);
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

    const lenX = Math.abs(this.pointStart.x - mouse.x);
    const lenY = Math.abs(this.pointStart.y - mouse.y);

    const len = Math.sqrt((Math.pow(lenX, 2) + Math.pow(lenY, 2)));

    const pointsAmnt = Math.round(len / TOOL_RECTANGLE_POINT_DIFF_PX) + 1;

    const stepX = lenX / pointsAmnt;
    const stepY = lenY / pointsAmnt;

    for (let i = 1; i < pointsAmnt; i++) {
      this.path.addLineToPoint({
        x: this.pointStart.x + (goingRight ? i : -i) * stepX,
        y: this.pointStart.y + (goingDown  ? i : -i) * stepY,
      });
    }
  }

  onDeselect(): void { }
}

import { WournalPage } from "./WournalPage";
import { CanvasPath } from "./CanvasPath";
import { CanvasTool } from "./CanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";

const TOOL_ELLIPSE_POINT_DIFF_PX = 5;

export class CanvasToolEllipse extends CanvasTool {
  private get conf() {
    return this.activePage.value.doc.toolConfig.value.CanvasToolEllipse
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
      // this.path.pulsePoints();
      this.path = null;
    }
  }

  public onMouseMove(e: MouseEvent): void {
    if (this.path === null) return;
    const mouse = this.toolUseStartPage.globalCoordsToCanvas({ x: e.x, y: e.y });

    const lenX = mouse.x - this.pointStart.x;
    const lenY = mouse.y - this.pointStart.y;

    if (lenX == 0 || lenY == 0) return;

    const centre = {
      x: this.pointStart.x + lenX / 2,
      y: this.pointStart.y + lenY / 2,
    }

    this.path.startAt({x: centre.x, y: centre.y + lenY / 2});

    // credits: https://www.mathsisfun.com/geometry/ellipse-perimeter.html
    const a = Math.abs(lenX / 2); const b = Math.abs(lenY / 2);
    const circumferenceRamanujan = Math.PI * (
      3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))
    );

    const numPoints = circumferenceRamanujan / TOOL_ELLIPSE_POINT_DIFF_PX;

    // credits: https://stackoverflow.com/q/39098308
    let angle: number;
    const tangent = lenX / lenY;
    for (let i = 0; i < numPoints; i++) {
      angle = (2 * Math.PI / numPoints) * i;
      const point = {
        x: centre.x + Math.sin(angle) * (lenY / 2) * tangent,
        y: centre.y + Math.cos(angle) * (lenY / 2),
      }
      this.path.addLineToPoint(point);
    }

    this.path.close();
  }

  onDeselect(): void { }
}

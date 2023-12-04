import { WournalPage } from "./WournalPage";
import { CanvasTool } from "./CanvasTool";

export class CanvasToolHand extends CanvasTool {

  public idleCursor = "grab";
  protected toolUseStartPage: WournalPage;

  private pointStart: { x: number, y: number } = null;
  private pos: { left: number, top: number; x: number, y: number };

  public override canSetStrokeWidth = false;
  public override canSetColor = false;

  private state: 'dragging' | 'idle' = 'idle';

  public onMouseDown(e: MouseEvent): void {
    this.toolUseStartPage = this.activePage.value;
    if (this.toolUseStartPage === null) return;

    this.idleCursor = '';

    this.pos = {
      ...this.activePage.value.doc.api.getScrollPos(),
      x: e.clientX, y: e.clientY,
    };

    this.state = 'dragging';
    this.activePage.value.toolLayer.style.cursor = 'grabbing';
  }

  public onMouseMove(e: MouseEvent): void {
    if (this.state !== 'dragging') return;
    // How far the mouse has been moved
    const dx = e.clientX - this.pos.x;
    const dy = e.clientY - this.pos.y;

    // Scroll the element
    this.activePage.value.doc.api.scrollPos(
      this.pos.top - dy,
      this.pos.left - dx,
    );
  }

  public onMouseUp(e: MouseEvent): void {
    // this.activePage.value.doc.api.scrollPos()
    this.state = 'idle';
    this.activePage.value.toolLayer.style.cursor = 'grab';
  }

  onDeselect(): void { }
}

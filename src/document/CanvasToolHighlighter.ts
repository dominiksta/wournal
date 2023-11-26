import { CanvasToolPen } from "./CanvasToolPen";

export class CanvasToolHighlighter extends CanvasToolPen {
  #conf() {
    return this.activePage.value.doc.toolConfig.value.CanvasToolHighlighter;
  }
  protected override get cfgColor() { return this.#conf().color };
  protected override get cfgStrokeWidth() { return this.#conf().strokeWidth };
  protected override get cfgMouseBufferSize() { return 4 };

  protected static override opacity = 0.5;
  protected static override lineCap = "";

  protected override actualStrokeWidth(): number {
    const confWidth = this.cfgStrokeWidth;
    if (confWidth === "fine") return 5;
    if (confWidth === "medium") return 15;
    if (confWidth === "thick") return 25;
  }
}

import { CanvasTool } from "./CanvasTool";

export class CanvasToolSelectText extends CanvasTool {

  public override idleCursor = 'default';

  public override canSetStrokeWidth = true;
  public override canSetColor = true;

  override onDeselect() {
    document.getSelection().removeAllRanges();
  }
  override onMouseDown() { }
  override onMouseMove() { }
  override onMouseUp() { }
}

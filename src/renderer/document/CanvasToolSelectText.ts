import { CanvasTool } from "./CanvasTool";

export class CanvasToolSelectText extends CanvasTool {

  public override idleCursor = 'default';

  public override canSetStrokeWidth = false;
  public override canSetColor = false;

  override onDeselect() {
    document.getSelection().removeAllRanges();
  }
  override onMouseDown() { }
  override onMouseMove() { }
  override onMouseUp() { }
}

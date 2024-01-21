import { CanvasTool } from "./CanvasTool";

export class CanvasToolSelectText extends CanvasTool {

  public override idleCursor = 'default';

  public override canSetStrokeWidth = false;
  public override canSetColor = false;

  override onDeselect() { }
  override onMouseDown() { }
  override onMouseMove() { }
  override onMouseUp() { }
}

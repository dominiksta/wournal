import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { TransformableSVGElement } from "./TransformableSVGElement";

/**
 * Implementations of this class should hold data describing every property
 * needed to create a corresponding WournalCanvasElement.
 */
export abstract class CanvasElementData { }

/**
 * An Element on a Wournal svg canvas.
 */
export abstract class CanvasElement extends TransformableSVGElement {
  /**
   * Color can be in multiple formats, including hex with a prefixed # ("HTML
   * Style Colors").
   */
  abstract setColor(color: string): void;
  /** If applicable, set stroke width, else noop */
  abstract setStrokeWidth(width: CanvasToolStrokeWidth): void;

  abstract getData(): CanvasElementData;
  abstract setData(dto: CanvasElementData): void;
}

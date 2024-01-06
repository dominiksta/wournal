import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { TransformableSVGElement } from "./TransformableSVGElement";

export type CanvasElementDTO = {
  name: 'Text' | 'Image' | 'Path';
  [key: string]: any;
}

/**
 * An Element on a Wournal svg canvas.
 */
export abstract class CanvasElement<SerializedT extends CanvasElementDTO>
  extends TransformableSVGElement {
  /**
   * Color can be in multiple formats, including hex with a prefixed # ("HTML
   * Style Colors").
   */
  abstract setColor(color: string): void;
  /** If applicable, set stroke width, else noop */
  abstract setStrokeWidth(width: CanvasToolStrokeWidth): void;

  abstract serialize(): SerializedT;
  abstract deserialize(dto: SerializedT): void;
}

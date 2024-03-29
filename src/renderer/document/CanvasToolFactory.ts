import { Newable } from "../util/Newable";
import { CanvasTool, CanvasToolName } from "./CanvasTool";
import { CanvasToolEllipse } from "./CanvasToolEllipse";
import { CanvasToolEraser } from "./CanvasToolEraser";
import { CanvasToolHand } from "./CanvasToolHand";
import { CanvasToolHighlighter } from "./CanvasToolHighlighter";
import { CanvasToolImage } from "./CanvasToolImage";
import { CanvasToolPen } from "./CanvasToolPen";
import { CanvasToolRectangle } from "./CanvasToolRectangle";
import { CanvasToolRuler } from "./CanvasToolRuler";
import { CanvasToolSelectRectangle } from "./CanvasToolSelectRectangle";
import { CanvasToolSelectText } from "./CanvasToolSelectText";
import { CanvasToolText } from "./CanvasToolText";

export class CanvasToolFactory {

  static forName(name: CanvasToolName): Newable<CanvasTool> {
    switch (name) {
      case 'CanvasToolPen': return CanvasToolPen;
      case 'CanvasToolHighlighter': return CanvasToolHighlighter;
      case 'CanvasToolEraser': return CanvasToolEraser;
      case 'CanvasToolRectangle': return CanvasToolRectangle;
      case 'CanvasToolEllipse': return CanvasToolEllipse;
      case 'CanvasToolSelectRectangle': return CanvasToolSelectRectangle;
      case 'CanvasToolText': return CanvasToolText;
      case 'CanvasToolRuler': return CanvasToolRuler;
      case 'CanvasToolHand': return CanvasToolHand;
      case 'CanvasToolImage': return CanvasToolImage;
      case 'CanvasToolSelectText': return CanvasToolSelectText;
      default: throw new Error(`Invalid Tool Name: ${name}`);
    }
  }
}

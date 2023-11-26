import { Newable } from "../util/Newable";
import { CanvasTool, CanvasToolName } from "./CanvasTool";
import { CanvasToolEraser } from "./CanvasToolEraser";
import { CanvasToolHighlighter } from "./CanvasToolHighlighter";
import { CanvasToolPen } from "./CanvasToolPen";
import { CanvasToolRectangle } from "./CanvasToolRectangle";
import { CanvasToolRuler } from "./CanvasToolRuler";
import { CanvasToolSelectRectangle } from "./CanvasToolSelectRectangle";
import { CanvasToolText } from "./CanvasToolText";

export class CanvasToolFactory {

  static forName(name: CanvasToolName): Newable<CanvasTool> {
    switch (name) {
      case "CanvasToolPen": return CanvasToolPen;
      case "CanvasToolHighlighter": return CanvasToolHighlighter;
      case "CanvasToolEraser": return CanvasToolEraser;
      case "CanvasToolRectangle": return CanvasToolRectangle;
      case "CanvasToolSelectRectangle": return CanvasToolSelectRectangle;
      case "CanvasToolText": return CanvasToolText;
      case "CanvasToolRuler": return CanvasToolRuler;
    }
  }
}

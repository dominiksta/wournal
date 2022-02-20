import { Newable } from "../util/Newable";
import { CanvasTool, CanvasToolName } from "./CanvasTool";
import { CanvasToolEraser } from "./CanvasToolEraser";
import { CanvasToolPen } from "./CanvasToolPen";
import { CanvasToolRectangle } from "./CanvasToolRectangle";
import { CanvasToolSelectRectangle } from "./CanvasToolSelectRectangle";
import { CanvasToolText } from "./CanvasToolText";

export class CanvasToolFactory {

    static forName(name: CanvasToolName): Newable<CanvasTool> {
        switch (name) {
            case "CanvasToolPen": return CanvasToolPen;
            case "CanvasToolEraser": return CanvasToolEraser;
            case "CanvasToolRectangle": return CanvasToolRectangle;
            case "CanvasToolSelectRectangle": return CanvasToolSelectRectangle;
            case "CanvasToolText": return CanvasToolText;
        }
    }
}

import { CanvasToolName } from "../document/CanvasTool"

export type CanvasToolStrokeWidth = "fine" | "medium" | "thick" | "none";

export type CanvasToolPenConfig = {
    color: string,
    strokeWidth: CanvasToolStrokeWidth,
    mouseBufferSize: number,
}

export type CanvasToolEraserConfig = {
    strokeWidth: CanvasToolStrokeWidth,
    eraseStrokes: boolean,
}

export type CanvasToolTextConfig = {
    color: string,
    fontSize: number,
    fontFamily: string,
}

export type CanvasToolRectangleConfig = {
    color: string,
    strokeWidth: CanvasToolStrokeWidth,
}

export type CanvasToolConfig = {
    CanvasToolPen: CanvasToolPenConfig,
    CanvasToolEraser: CanvasToolEraserConfig,
    CanvasToolText: CanvasToolTextConfig,
    CanvasToolRectangle: CanvasToolRectangleConfig,
}

export type ConfigDTO = {
    version: 0.01,
    binds: {
        rightClick: CanvasToolName,
    },
    tools: CanvasToolConfig,
}

export function defaultConfig(): ConfigDTO {
    return {
        version: 0.01,
        binds: {
            rightClick: "CanvasToolEraser",
        },
        tools: {
            CanvasToolPen: {
                color: "#000000",
                strokeWidth: "medium",
                mouseBufferSize: 4,
            },
            CanvasToolEraser: {
                strokeWidth: "medium",
                eraseStrokes: false,
            },
            CanvasToolText: {
                color: "#000000",
                fontFamily: "sans-serif",
                fontSize: 17,
            },
            CanvasToolRectangle: {
                color: "#000000",
                strokeWidth: "medium",
            }
        }
    }
}

import { CanvasToolName } from "../document/CanvasTool"

export type CanvasToolPenConfig = {
    color: string,
    size: number,
    mouseBufferSize: number,
}

export type CanvasToolEraserConfig = {
    size: number,
    eraseStrokes: boolean,
}

export type CanvasToolTextConfig = {
    color: string,
    fontSize: number,
    fontFamily: string,
}

export type CanvasToolConfig = {
    CanvasToolPen: CanvasToolPenConfig,
    CanvasToolEraser: CanvasToolEraserConfig,
    CanvasToolText: CanvasToolTextConfig,
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
                size: 2,
                mouseBufferSize: 4,
            },
            CanvasToolEraser: {
                size: 10,
                eraseStrokes: false,
            },
            CanvasToolText: {
                color: "#000000",
                fontFamily: "sans-serif",
                fontSize: 17,
            }
        }
    }
}

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
  fontStyle: "normal" | "italic",
  fontWeight: "normal" | "bold",
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

export type CanvasToolConfigData = CanvasToolConfig[keyof CanvasToolConfig];

export type ConfigDTO = {
  version: 0.01,
  theme: "dark" | "light" | "auto",
  colorPalette: { color: string, name: string }[],
  binds: {
    rightClick: CanvasToolName,
  },
  tools: CanvasToolConfig,
}

export function defaultConfig(): ConfigDTO {
  return {
    version: 0.01,
    // NOTE(dominiksta): While automatically inverting colors could be
    // considered unintuitive and therefore bad default behaviour, I want
    // this to be set for further development. Once wournal launches, the
    // theme should likely be set to "light" by default.
    theme: "auto",
    binds: {
      rightClick: "CanvasToolEraser",
    },
    colorPalette: [ // stolen from xournal
      { name: "Black", color: "#000000" },
      { name: "Blue", color: "#2F2FE7" },
      { name: "Red", color: "#FF0000" },
      { name: "Green", color: "#008A00" },
      { name: "Gray", color: "#808080" },
      { name: "Light Blue", color: "#00CAFF" },
      { name: "Light Green", color: "#00FF00" },
      { name: "Magenta", color: "#FF00FF" },
      { name: "Orange", color: "#FF7B00" },
      { name: "Yellow", color: "#FFFF00" },
      { name: "White", color: "#FFFFFF" },
    ],
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
        fontStyle: "normal",
        fontWeight: "normal",
        fontFamily: "Roboto Mono",
        fontSize: 18, // fits graph paper pretty well
      },
      CanvasToolRectangle: {
        color: "#000000",
        strokeWidth: "medium",
      }
    }
  }
}

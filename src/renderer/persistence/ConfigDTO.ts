import { JTDDataType } from "ajv/dist/core";
import DTOVersioner from "util/DTOVersioner";
import { CanvasToolNames } from "../document/CanvasTool"
import Ajv from 'ajv/dist/jtd';

const ajv = new Ajv();

export type CanvasToolStrokeWidth = "fine" | "medium" | "thick";
const CanvasToolStrokeWidthSchema = { enum: [ 'fine', 'medium', 'thick' ] } as const;

const CanvasToolPenConfigSchema = {
  properties: {
    color: { type: 'string' },
    strokeWidth: CanvasToolStrokeWidthSchema,
    mouseBufferSize: { type: 'int32' }
  },
} as const;
export type CanvasToolPenConfig
  = JTDDataType<typeof CanvasToolPenConfigSchema>;

const CanvasToolEraserConfigSchema = {
  properties: {
    strokeWidth: CanvasToolStrokeWidthSchema,
    eraseStrokes: { type: 'boolean' }
  },
} as const;
export type CanvasToolEraserConfig
  = JTDDataType<typeof CanvasToolEraserConfigSchema>;

const CanvasToolTextConfigSchema = {
  properties: {
    color: { type: 'string' },
    fontSize: { type: 'int32' },
    fontStyle: { enum: [ 'normal', 'italic' ] },
    fontWeight: { enum: [ 'normal', 'bold' ] },
    fontFamily: { type: 'string' },
  },
} as const;
export type CanvasToolTextConfig
  = JTDDataType<typeof CanvasToolTextConfigSchema>;

const CanvasToolRectangleConfigSchema = {
  properties: {
    color: { type: 'string' },
    strokeWidth: CanvasToolStrokeWidthSchema,
  },
} as const;
export type CanvasToolRectangleConfig
  = JTDDataType<typeof CanvasToolRectangleConfigSchema>;

const CanvasToolRulerConfigSchema = {
  properties: {
    color: { type: 'string' },
    strokeWidth: CanvasToolStrokeWidthSchema,
  },
} as const;
export type CanvasToolRulerConfig
  = JTDDataType<typeof CanvasToolRulerConfigSchema>;

const CanvasToolEllipseConfigSchema = {
  properties: {
    color: { type: 'string' },
    strokeWidth: CanvasToolStrokeWidthSchema,
  },
} as const;
export type CanvasToolEllipseConfig
  = JTDDataType<typeof CanvasToolEllipseConfigSchema>;

const CanvasToolHighlighterConfigSchema = {
  properties: {
    color: { type: 'string' },
    strokeWidth: CanvasToolStrokeWidthSchema,
  },
} as const;
export type CanvasToolHighlighterConfig =
  JTDDataType<typeof CanvasToolHighlighterConfigSchema>;


const CanvasToolSelectTextConfigSchema = {
  properties: {
    color: { type: 'string' },
    strokeWidth: CanvasToolStrokeWidthSchema,
  },
} as const;
export type CanvasToolSelectTextConfigConfig =
  JTDDataType<typeof CanvasToolSelectTextConfigSchema>;

const CanvasToolConfigSchema = {
  properties: {
    CanvasToolPen: CanvasToolPenConfigSchema,
    CanvasToolEraser: CanvasToolEraserConfigSchema,
    CanvasToolText: CanvasToolTextConfigSchema,
    CanvasToolRectangle: CanvasToolRectangleConfigSchema,
    CanvasToolRuler: CanvasToolRulerConfigSchema,
    CanvasToolEllipse: CanvasToolEllipseConfigSchema,
    CanvasToolHighlighter: CanvasToolHighlighterConfigSchema,
    CanvasToolSelectText: CanvasToolSelectTextConfigSchema,
  },
} as const;
export type CanvasToolConfig = JTDDataType<typeof CanvasToolConfigSchema>;

export type CanvasToolConfigData = CanvasToolConfig[keyof CanvasToolConfig];

const AutosaveConfigSchema = {
  properties: {
    enable: { type: 'boolean' },
    intervalSeconds: { type: 'int32' },
    keepFiles: { type: 'int32' },
  }
} as const;
export type AutosaveConfig = JTDDataType<typeof AutosaveConfigSchema>;

const ConfigDTOSchema = {
  properties: {
    version: { type: 'float32' },
    checkUpdatesOnStartup: { type: 'boolean' },
    theme: { enum: [
      'light', 'dark',
      'light_high_contrast', 'dark_high_contrast',
      'auto', 'auto_high_contrast',
    ] },
    invertDocument: { type: 'boolean' },
    colorPalette: {
      elements: {
        properties: { color: { type: 'string' }, name: { type: 'string' } }
      }
    },
    binds: {
      properties: {
        rightClick: { enum: CanvasToolNames },
        middleClick: { enum: CanvasToolNames },
      }
    },
    autoOpenWojWithSameNameAsPDF: { type: 'boolean' },
    hideAnnotations: { type: 'boolean' },
    tools: CanvasToolConfigSchema,
    autosave: AutosaveConfigSchema,
    defaultZoomDocument: { type: 'float32' },
    zoomUI: { type: 'float32' },
  }
} as const;

export type ConfigDTO = JTDDataType<typeof ConfigDTOSchema>;

export const ConfigDTOVersioner = new DTOVersioner<ConfigDTO>({
  name: 'ConfigDTO',
  validator: ((() => {
    const validate = ajv.compile(ConfigDTOSchema);
    return obj => {
      const res = validate(obj);
      return { success: res, error: JSON.stringify(validate.errors) };
    }
  }))(),
  getVersion: obj => obj.version,
  updateFunctions: {

    // ver 0.2 -- just a test
    // ----------------------------------------------------------------------
    0.2: (ver0_01: any) => {
      return { ...ver0_01, version: 0.2 };
    },

    // ver 0.3 -- auto open woj with same name as pdf if available
    // ----------------------------------------------------------------------
    0.3: (ver0_2: any) => {
      return {
        ...ver0_2, version: 0.3,
        autoOpenWojWithSameNameAsPDF: true,
      };
    },

    // ver 0.4 -- autosaves
    // ----------------------------------------------------------------------
    0.4: (ver0_3: any) => {
      return {
        ...ver0_3, version: 0.4,
        autosave: { intervalSeconds: 3 * 60, enable: true, keepFiles: 300 },
      };
    },

    // ver 0.5 -- text select color
    // ----------------------------------------------------------------------
    0.5: (ver0_4: any) => {
      return {
        ...ver0_4, version: 0.5,
        tools: {
          ...ver0_4.tools,
          CanvasToolSelectText: {
            color: '#FFFF00',
            strokeWidth: 'medium',
          },
        }
      };
    },

    // ver 0.6 -- show/hide annotations
    // ----------------------------------------------------------------------
    0.6: (ver0_5: any) => {
      return {
        ...ver0_5, version: 0.6,
        hideAnnotations: false,
      };
    },

    // ver 0.7 -- document and ui zoom
    // ----------------------------------------------------------------------
    0.7: (ver0_6: any) => {
      return {
        ...ver0_6, version: 0.7,
        defaultZoomDocument: 1.0,
        zoomUI: 1.0,
      };
    },

    // ver 0.7 -- check for updates on startup
    // ----------------------------------------------------------------------
    0.8: (ver0_7: any) => {
      return {
        ...ver0_7, version: 0.8,
        checkUpdatesOnStartup: true,
      };
    },
  }
})

export const CONFIG_CURRENT_VERSION = ConfigDTOVersioner.maxVersion();

export function defaultConfig(): ConfigDTO {
  return {
    version: CONFIG_CURRENT_VERSION,
    checkUpdatesOnStartup: true,
    // NOTE(dominiksta): While automatically inverting colors could be
    // considered unintuitive and therefore bad default behaviour, I want
    // this to be set for further development. Once wournal launches, the
    // theme should likely be set to "light" by default.
    theme: "auto",
    invertDocument: true,
    binds: {
      rightClick: "CanvasToolEraser",
      middleClick: "CanvasToolHand",
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
    autoOpenWojWithSameNameAsPDF: true,
    hideAnnotations: false,
    autosave: {
      intervalSeconds: 3 * 60,
      enable: true,
      keepFiles: 300,
    },
    defaultZoomDocument: 1.0,
    zoomUI: 1.0,
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
      },
      CanvasToolHighlighter: {
        color: "#FFFF00",
        strokeWidth: "medium",
      },
      CanvasToolRuler: {
        color: "#000000",
        strokeWidth: "medium",
      },
      CanvasToolEllipse: {
        color: "#000000",
        strokeWidth: "medium",
      },
      CanvasToolSelectText: {
        color: "#FFFF00",
        strokeWidth: "medium",
      },
    }
  }
}

import { parseArgs, ParseArgsConfig } from "node:util";

export const argvParseSpec = {
  options: {
    'page-height': { type: "string" },
    'page-width':  { type: "string" },
    'page-size':   { type: "string" },
    'page-color':  { type: "string" },
    'help':        { type: "boolean" },
  },
  allowPositionals: true,
  strict: false,
} satisfies ParseArgsConfig;

export type ArgvParsed = ReturnType<typeof parseArgs<typeof argvParseSpec>>;

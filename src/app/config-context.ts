import { rx } from "@mvui/core";
import { defaultConfig } from "persistence/ConfigDTO";

export const ConfigCtx = new rx.Context(() => new rx.State(defaultConfig()));

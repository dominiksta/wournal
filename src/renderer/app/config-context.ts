import { rx } from "@mvui/core";
import { defaultConfig, ConfigDTO } from "persistence/ConfigDTO";

export const ConfigCtx = new rx.Context<rx.State<ConfigDTO>>();

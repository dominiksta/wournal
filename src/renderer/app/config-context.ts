import { rx } from "@mvuijs/core";
import { defaultConfig, ConfigDTO } from "persistence/ConfigDTO";

export const ConfigCtx = new rx.Context<rx.State<ConfigDTO>>();

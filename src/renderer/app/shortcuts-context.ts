import { rx } from "@mvui/core";
import { ShortcutManager } from "./shortcuts";

export const ShortcutsCtx = new rx.Context(() => new ShortcutManager());

import { rx } from "@mvuijs/core";

export const ToastCtx = new rx.Context(() => ({ open: (msg: string) => null }));

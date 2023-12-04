import { rx } from "@mvui/core";

export const ToastCtx = new rx.Context(() => ({ open: (msg: string) => null }));

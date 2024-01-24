import { rx } from "@mvui/core";
import { WournalDocument } from "document/WournalDocument";

export const DocumentCtx = new rx.Context<rx.State<WournalDocument>>();

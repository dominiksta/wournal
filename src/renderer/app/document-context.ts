import { rx } from "@mvuijs/core";
import { WournalDocument } from "document/WournalDocument";

export const DocumentCtx = new rx.Context<rx.State<WournalDocument>>();

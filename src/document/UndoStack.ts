import { rx } from "@mvui/core";
import { WournalDocument } from "./WournalDocument";

export interface UndoAction {
  undo(doc: WournalDocument): void;
  redo(doc: WournalDocument): void;
}

const MAX_UNDO_ACTIONS = 100;

export class UndoStack {
  private undoable: UndoAction[] = [];
  private redoable: UndoAction[] = [];

  constructor(
    private doc: WournalDocument
  ) { }

  public redoAvailable = new rx.State(false);
  public undoAvailable = new rx.State(false);

  private notifyAvailable() {
    this.undoAvailable.next(this.undoable.length > 0);
    this.redoAvailable.next(this.redoable.length > 0);
  }

  public push(action: UndoAction): void {
    this.redoable = [];
    this.undoable.push(action);
    if (this.undoable.length > MAX_UNDO_ACTIONS)
      this.undoable.splice(0, 1)
    // LOG.debug("Undoable action pushed");
    // LOG.debug(action);
    this.notifyAvailable();
  }

  public undo(): void {
    if (this.undoable.length === 0) return;
    let action = this.undoable.pop();
    action.undo(this.doc);
    this.redoable.push(action);
    // LOG.debug("Undo:");
    // LOG.debug(action);
    this.notifyAvailable();
  }

  public redo(): void {
    if (this.redoable.length === 0) return;
    let action = this.redoable.pop();
    action.redo(this.doc);
    this.undoable.push(action);
    // LOG.debug("Redo:");
    // LOG.debug(action);
    this.notifyAvailable();
  }

  public clear(): void {
    this.redoable = [];
    this.undoable = [];
    this.notifyAvailable();
  }
}

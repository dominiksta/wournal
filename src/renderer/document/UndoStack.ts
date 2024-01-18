import { rx } from "@mvui/core";
import { WournalDocument } from "./WournalDocument";

export interface UndoAction {
  undo(doc: WournalDocument): void;
  redo(doc: WournalDocument): void;
}

const MAX_UNDO_ACTIONS = 100;

export class UndoStack {
  public undoable: UndoAction[] = [];
  public redoable: UndoAction[] = [];

  constructor(
    private doc: WournalDocument
  ) { }

  public redoAvailable = new rx.State(false);
  public undoAvailable = new rx.State(false);

  private notifyAvailable() {
    if (this.undoAvailable.value !== this.undoable.length > 0)
      this.undoAvailable.next(this.undoable.length > 0);
    if (this.redoAvailable.value !== this.redoable.length > 0)
      this.redoAvailable.next(this.redoable.length > 0);
  }

  public push(action: UndoAction): void {
    this.redoable = [];
    this.undoable.push(action);
    if (this.undoable.length > MAX_UNDO_ACTIONS)
      this.undoable.splice(0, 1)
    // console.debug('Undoable action pushed', action);
    this.notifyAvailable();
  }

  public undo(): void {
    if (this.undoable.length === 0) return;
    let action = this.undoable.pop();
    action.undo(this.doc);
    this.redoable.push(action);
    // console.debug('Undo:', action);
    this.notifyAvailable();
  }

  public redo(): void {
    if (this.redoable.length === 0) return;
    let action = this.redoable.pop();
    action.redo(this.doc);
    this.undoable.push(action);
    // console.debug('Redo:', action);
    this.notifyAvailable();
  }

  public clear(): void {
    console.debug('Undo stack cleared');
    this.redoable = [];
    this.undoable = [];
    this.notifyAvailable();
  }
}

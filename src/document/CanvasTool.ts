import { rx } from "@mvui/core";
import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { CanvasSelection } from "./CanvasSelection";
import { UndoStack } from "./UndoStack";
import { WournalPage } from "./WournalPage";

/** All available `CanvasTool`s */
export const CanvasToolNames = [
  "CanvasToolPen",
  "CanvasToolHighlighter",
  "CanvasToolRuler",
  "CanvasToolEraser",
  "CanvasToolRectangle",
  "CanvasToolEllipse",
  "CanvasToolSelectRectangle",
  "CanvasToolText",
] as const;
/** All available `CanvasTool`s */
export type CanvasToolName = typeof CanvasToolNames[number];

export class CanvasToolSetupProps {
  constructor(
    /** Get the page of the wournal document to draw on. */
    public getActivePage: () => WournalPage,
    /** The undo stack to push undoable actions to. */
    public undoStack: UndoStack,
    /** The current selection. */
    public selection: CanvasSelection,
  ) { }
}

export abstract class CanvasTool {
  get name(): CanvasToolName { return (this as any).constructor.name; }

  /** This cursor should be displayed when the tool is selected */
  public abstract idleCursor: string;
  /** The page where the first mousedown event for the tool was fired */
  protected abstract toolUseStartPage: WournalPage;

  public abstract canSetStrokeWidth: boolean;
  public abstract canSetColor: boolean;

  constructor(
    /** Get the page of the wournal document to draw on. */
    protected activePage: rx.State<WournalPage>,
    /** The undo stack to push undoable actions to. */
    protected undoStack: UndoStack,
    /** The current selection. */
    protected selection: CanvasSelection,
  ) { }

  /**
   * When the tool is deselected (from e.g. the toolbar), it might have to do
   * some cleanup work.
   */
  abstract onDeselect(): void;
  abstract onMouseDown(e: MouseEvent): void;
  abstract onMouseMove(e: MouseEvent): void;
  abstract onMouseUp(e: MouseEvent): void;
}

import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { CanvasSelection } from "./SelectionDisplay";
import { UndoStack } from "./UndoStack";
import { WournalPage } from "./WournalPage";

/** All available `CanvasTool`s */
export const CanvasToolNames = [
    "CanvasToolPen",
    "CanvasToolEraser",
    "CanvasToolRectangle",
    "CanvasToolSelectRectangle",
    "CanvasToolText"
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

    static humanName(name: CanvasToolName) {
        switch (name) {
            case "CanvasToolPen": return "Pen";
            case "CanvasToolEraser": return "Eraser";
            case "CanvasToolRectangle": return "Rectangle";
            case "CanvasToolSelectRectangle": return "Select Rectangle";
            case "CanvasToolText": return "Text Box";
        }
    }

    /** This cursor should be displayed when the tool is selected */
    public abstract idleCursor: string;
    /** The page where the first mousedown event for the tool was fired */
    protected abstract toolUseStartPage: WournalPage;

    /** If applicable, set stroke width, else noop */
    public abstract setStrokeWidth(width: CanvasToolStrokeWidth): void;
    /** If applicable, return stroke width, else null */
    public abstract getStrokeWidth(): CanvasToolStrokeWidth;

    /** Get the page of the wournal document to draw on. */
    protected getActivePage: () => WournalPage;

    /** The undo stack to push undoable actions to. */
    protected undoStack: UndoStack;

    /** The current selection. */
    protected selection: CanvasSelection;

    setup(props: CanvasToolSetupProps): void {
        this.getActivePage = props.getActivePage;
        this.undoStack = props.undoStack;
        this.selection = props.selection;
    }

    /**
     * When the tool is deselected (from e.g. the toolbar), it might have to do
     * some cleanup work.
     */
    abstract onDeselect(): void;
    abstract onMouseDown(e: MouseEvent): void;
    abstract onMouseMove(e: MouseEvent): void;
    abstract onMouseUp(e: MouseEvent): void;
}

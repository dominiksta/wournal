import { WournalPage } from "./WournalPage";

export abstract class SVGCanvasTool {

    /** This cursor should be displayed when the tool is selected */
    public abstract idleCursor: string;
    /** The page where the first mousedown event for the tool was fired */
    protected abstract toolUseStartPage: WournalPage;

    constructor(
        protected getActivePage: () => WournalPage
    ) {}

    /**
     * When the tool is deselected (from e.g. the toolbar), it might have to do
     * some cleanup work.
     */
    abstract onDeselect(): void;
    abstract onMouseDown(e: MouseEvent): void;
    abstract onMouseMove(e: MouseEvent): void;
    abstract onMouseUp(e: MouseEvent): void;
}

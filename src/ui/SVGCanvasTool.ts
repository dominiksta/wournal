import { WournalPage } from "./WournalPage";

export abstract class SVGCanvasTool {

    /** This cursor should be displayed when the tool is selected */
    public abstract idleCursor: string;
    /** The page where the first mousedown event for the tool was fired */
    protected abstract toolUseStartPage: WournalPage;

    constructor(
        protected getActivePage: () => WournalPage
    ) {}

    abstract onMouseDown(e: MouseEvent): void;
    abstract onMouseMove(e: MouseEvent): void;
    abstract onMouseUp(e: MouseEvent): void;
}

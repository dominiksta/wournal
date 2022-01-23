import { SVGCanvas } from "./SVGCanvas";

export abstract class SVGCanvasTool {

    protected abstract cursor: string;

    constructor(
        protected canvas: SVGCanvas
    ) {}

    abstract onMouseDown(e: MouseEvent): void;
    abstract onMouseMove(e: MouseEvent): void;
    abstract onMouseUp(e: MouseEvent): void;
}

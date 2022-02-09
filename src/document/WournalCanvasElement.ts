import { LOG } from "../util/Logging";

/**
 * Implementations of this class should hold data describing every property
 * needed to create a corresponding WournalCanvasElement.
 */
export abstract class WournalCanvasElementData { }

/**
 * An Element on a Wournal svg canvas.
 */
export abstract class WournalCanvasElement {

    get svgElem() { return this._svgElem; }

    /** The transform as it was parsed from the actual svg element */
    protected initialTransform = {
        translateX: 0, translateY: 0,
        rotateDeg: 0,
        scaleX: 1, scaleY: 1
    }

    /** The currently set transform */
    protected currentTransform = {
        translateX: 0, translateY: 0,
        rotateDeg: 0,
        scaleX: 1, scaleY: 1
    }

    constructor(protected _svgElem: SVGGraphicsElement) {
        this.parseTransform()
        this.resetTransform();
    }

    /**
     * Color can be in multiple formats, including hex with a prefixed # ("HTML
     * Style Colors").
     */
    abstract setColor(color: string): void;

    abstract getData(): WournalCanvasElementData;
    abstract setData(dto: WournalCanvasElementData): void;

    /** Remove the underlying element from whatever parent element */
    public destroy(): void {
        this._svgElem.parentNode.removeChild(this._svgElem);
    }

    /**
     * "Render" `currentTransform` into the transform attribute of the svg
     * element
     */
    private updateTransformAttribute() {
        const t = this.currentTransform;
        this._svgElem.setAttribute(
            "transform",
            (t.translateX != 0 || t.translateY != 0
                ? `translate(${t.translateX} ${t.translateY}) ` : "") +
            (t.rotateDeg != 0
                ? `rotate(${t.rotateDeg}) ` : "") +
            (t.scaleX != 1 || t.scaleY != 1
                ? `scale(${t.scaleX} ${t.scaleY}) ` : "")
        );
    }

    /** Reset `currentTransform` back to `initialTransform` and render. */
    public resetTransform() {
        this.currentTransform = {
            translateX: this.initialTransform.translateX,
            translateY: this.initialTransform.translateY,
            rotateDeg: this.initialTransform.rotateDeg,
            scaleX: this.initialTransform.scaleX,
            scaleY: this.initialTransform.scaleY
        }
        this.updateTransformAttribute();
    }

    /**
     * Write the current transform to the elements coordinates/path. This is
     * done for several reasons:
     * - It makes it easier to do certain transformations (for example scaling
     *   in place)
     * - If wournal should ever actually evolve into a xournal clone, we would
     *   have to take care of PDF export. PDF export libraries typically only
     *   allow drawing points/lines and don't take any transformation
     *   attributes. So, writing the transformation to the coordinates/path
     *   should allow for easier pdf export.
     */
    public abstract writeTransform(): void;

    /** Move the element from its current position */
    public translate(x: number, y: number): void {
        this.currentTransform.translateX += x;
        this.currentTransform.translateY += y;
        this.updateTransformAttribute();
    }

    /**
     * Scale the element *without accounting for its position*. See
     * `scaleInPlace`.
     */
    private scale(x: number, y: number): void {
        this.currentTransform.scaleX *= x;
        this.currentTransform.scaleY *= y;
        this.updateTransformAttribute();
    }

    /**
     * Scale the element within the given bounding rectangle instead of in the
     * canvas coordinate system.
     */
    public scaleInPlace(
        before: DOMRect, direction: "top" | "right" | "bottom" | "left",
        amount: number
    ): void {
        switch(direction) {
            case "top":
                this.scale(1, amount);
                this.translate(
                    0, -((before.bottom * this.currentTransform.scaleY -
                        before.bottom * this.initialTransform.scaleY
                         )));
                break;
            case "right":
                this.scale(amount, 1);
                this.translate(
                    -((before.left * this.currentTransform.scaleX -
                        before.left * this.initialTransform.scaleX
                      )), 0);
                break;
            case "bottom":
                this.scale(1, amount);
                this.translate(
                    0, -((before.top * this.currentTransform.scaleY -
                        before.top * this.initialTransform.scaleY
                         )));
                break;
            case "left":
                this.scale(amount, 1);
                this.translate(
                    -((before.right * this.currentTransform.scaleX -
                        before.right * this.initialTransform.scaleX
                      )), 0);
                break;
        }
    }

    // rotate(deg: number): void {
    // }

    /**
     * Parse the `transform` attribute of an svg element. Code from "Paul
     * LeBeau" (https://stackoverflow.com/a/41102221)
     */
    private parseTransform() {
        const transforms = this._svgElem.transform.baseVal;
        for (var i = 0; i < transforms.numberOfItems; i++) {
            let transform = transforms.getItem(i);
            let m = transform.matrix;
            switch (transform.type) {
                case 2:
                    this.initialTransform.translateX = m.e;
                    this.initialTransform.translateY = m.f;
                    break;
                case 3:
                    this.initialTransform.scaleX = m.a;
                    this.initialTransform.scaleY = m.d;
                    break;
                case 4:
                    this.initialTransform.rotateDeg = transform.angle;
                    break;
                case 5:
                case 6:
                case 1:
                default:
                    LOG.warn(
                        `incompatible transformation type ${transform.type}: matrix(`+
                            m.a+","+m.b+","+m.c+","+m.d+","+m.e+","+m.f+")"
                    )
                    break;
            }
        }
    }
}

import { LOG } from "../util/Logging";

export abstract class WournalCanvasElement {

    private initialTransform = {
        translateX: 0, translateY: 0,
        rotateDeg: 0,
        scaleX: 0, scaleY: 0
    }

    private currentTransform = {
        translateX: 0, translateY: 0,
        rotateDeg: 0,
        scaleX: 0, scaleY: 0
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

    private updateTransformAttribute() {
        const t = this.currentTransform;
        this._svgElem.setAttribute(
            "transform",
            (t.translateX != 0 || t.translateY != 0
                ? `translate(${t.translateX} ${t.translateY}) ` : "") +
            (t.rotateDeg != 0
                ? `rotate(${t.rotateDeg}) ` : "") +
            (t.scaleX != 0 || t.scaleY != 0
                ? `scale(${t.scaleX} ${t.scaleY}) ` : "")
        );
    }

    resetTransform() {
        this.currentTransform = {
            translateX: this.initialTransform.translateX,
            translateY: this.initialTransform.translateY,
            rotateDeg: this.initialTransform.rotateDeg,
            scaleX: this.initialTransform.scaleX,
            scaleY: this.initialTransform.scaleY
        }
        this.updateTransformAttribute();
    }

    translate(x: number, y: number): void {
        this.currentTransform.translateX += x;
        this.currentTransform.translateY += y;
        this.updateTransformAttribute();
    }

    // rotate(deg: number): void {
    // }
    // scale(x: number, y: number): void {
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

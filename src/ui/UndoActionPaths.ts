import { DOMUtils } from "../util/DOMUtils";
import { LOG } from "../util/Logging";
import { UndoAction } from "./UndoStack";
import { WournalDocument } from "./WournalDocument";

export class UndoActionPaths implements UndoAction {

    private deleted: {
            layer: SVGGElement, index: number, path: SVGPathElement
    }[] = [];

    private changed: {
        path: SVGPathElement,
        attrsBefore: Map<string, string>,
        attrsAfter: Map<string, string>
    }[] = [];

    private added: {
        layer: SVGGElement, index: number, path: SVGPathElement
    }[] = [];

    constructor(
        deleted: SVGPathElement[] | null,
        changed: {
            path: SVGPathElement,
            attrsBefore: Map<string, string>,
            attrsAfter: Map<string, string>
        }[] | null,
        added:  SVGPathElement[] | null,
    ) {
        // enrich data about deleted and added elements
        const enrich = (source: SVGPathElement[]) => {
            return source.map(v => {
                if (!(v.parentNode instanceof SVGGElement)) {
                    LOG.error(v);
                    throw new Error(
                        "could not find layer for element pushed to undo stack"
                    )
                };
                return {
                    layer: v.parentNode as SVGGElement,
                    index: DOMUtils.nodeIndexInParent(v),
                    path: v
                };
            })
        }

        if (deleted != null) this.deleted = enrich(deleted);
        if (added != null) this.added = enrich(added);
        if (changed != null) this.changed = changed;
    }

    public undo(doc: WournalDocument): void {
        for(let del of this.deleted) this.addAtIndex(del)
        for(let add of this.added) add.layer.removeChild(add.path);
        for(let chn of this.changed) {
            let newAttrs = new Map<string, string>();

            for (let k of chn.attrsAfter.keys())
                if (chn.attrsBefore.get(k) === undefined)
                    newAttrs.set(k, chn.attrsAfter.get(k));

            for (let attr of chn.attrsBefore)
                chn.path.setAttribute(attr[0], attr[1]);
            for (let attr of newAttrs) chn.path.removeAttribute(attr[0])
        }
    }

    public redo(doc: WournalDocument): void {
        for(let add of this.added) this.addAtIndex(add);
        for(let del of this.deleted) del.layer.removeChild(del.path);
        for(let chn of this.changed.slice().reverse()) {
            let delAttrs = new Map<string, string>();

            for (let k of chn.attrsBefore.keys())
                if (chn.attrsAfter.get(k) === undefined)
                    delAttrs.set(k, chn.attrsAfter.get(k));

            for (let attr of chn.attrsAfter)
                chn.path.setAttribute(attr[0], attr[1]);
            for (let attr of delAttrs) chn.path.removeAttribute(attr[0])
        }
    }

    private addAtIndex(
        el: {path: SVGPathElement, layer: SVGGElement, index: number}
    ) {
        let next = el.layer.children[el.index + 1];
        if (next) next.before(el.path);
        else el.layer.appendChild(el.path);
    }

    /** Append another UndoActionPaths */
    public add(action: UndoActionPaths) {
        Array.prototype.push.apply(this.added, action.added);
        Array.prototype.push.apply(this.changed, action.changed);
        Array.prototype.push.apply(this.deleted, action.deleted);
    }
}

// This will have to be written once layers become user modifiable:
// export class UndoActionLayer implements UndoAction {
// }

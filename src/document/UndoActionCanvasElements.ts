import { DOMUtils } from "../util/DOMUtils";
import { LOG } from "../util/Logging";
import { UndoAction } from "./UndoStack";
import { CanvasElementData } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import { WournalDocument } from "./WournalDocument";

export class UndoActionCanvasElements implements UndoAction {

  private deleted: {
    layer: SVGGElement, index: number, el: SVGGraphicsElement
  }[] = [];

  private changed: {
    el: SVGGraphicsElement,
    dataBefore: CanvasElementData,
    dataAfter: CanvasElementData
  }[] = [];

  private added: {
    layer: SVGGElement, index: number, el: SVGGraphicsElement
  }[] = [];

  constructor(
    deleted: SVGGraphicsElement[] | null,
    changed: {
      el: SVGGraphicsElement,
      dataBefore: CanvasElementData,
      dataAfter: CanvasElementData
    }[] | null,
    added: SVGGraphicsElement[] | null,
  ) {
    // enrich data about deleted and added elements
    const enrich = (source: SVGGraphicsElement[]) => {
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
          el: v
        };
      })
    }

    if (deleted != null) this.deleted = enrich(deleted);
    if (added != null) this.added = enrich(added);
    if (changed != null) this.changed = changed;
  }

  public undo(doc: WournalDocument): void {
    for (let del of this.deleted) this.addAtIndex(del)
    for (let add of this.added) add.layer.removeChild(add.el);
    for (let chn of this.changed) {
      let wournalEl = CanvasElementFactory.fromSvgElem(chn.el);
      wournalEl.setData(chn.dataBefore);
    }
  }

  public redo(doc: WournalDocument): void {
    for (let add of this.added) this.addAtIndex(add);
    for (let del of this.deleted) del.layer.removeChild(del.el);
    for (let chn of this.changed.slice().reverse()) {
      let wournalEl = CanvasElementFactory.fromSvgElem(chn.el);
      wournalEl.setData(chn.dataAfter);
    }
  }

  private addAtIndex(
    add: { el: SVGGraphicsElement, layer: SVGGElement, index: number }
  ) {
    let next = add.layer.children[add.index + 1];
    if (next) next.before(add.el);
    else add.layer.appendChild(add.el);
  }

  /** Append another UndoActionPaths */
  public add(action: UndoActionCanvasElements) {
    Array.prototype.push.apply(this.added, action.added);
    Array.prototype.push.apply(this.changed, action.changed);
    Array.prototype.push.apply(this.deleted, action.deleted);
  }
}

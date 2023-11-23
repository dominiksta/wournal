import { DOMUtils } from "../util/DOMUtils";
import { LOG } from "../util/Logging";
import { UndoAction } from "./UndoStack";
import { CanvasElementData } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import { WournalDocument } from "./WournalDocument";
import { WOURNAL_SVG_LAYER_CURRENT_ATTR, WOURNAL_SVG_LAYER_NAME_ATTR } from "./WournalPage";

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

export class UndoActionLayer implements UndoAction {

  constructor(
    private pageCanvas: SVGSVGElement,
    private updateList: () => void,
    private removed: SVGGElement[],
    private added: SVGGElement[],
    private listBefore: { name: string, current: boolean, visible: boolean }[],
    private listAfter: { name: string, current: boolean, visible: boolean }[],
  ) { }

  public undo() {
    for (let layer of this.removed) {
      const idx = this.listBefore.findIndex(
        l => l.name === layer.getAttribute(WOURNAL_SVG_LAYER_NAME_ATTR)
      );
      this.addAtIndex(layer, idx);
    }
    for (let layer of this.added) { this.pageCanvas.removeChild(layer) }
    this.setListAttributes(this.listBefore);
    this.updateList();
  }

  public redo() {
    for (let layer of this.added) {
      const idx = this.listAfter.findIndex(
        l => l.name === layer.getAttribute(WOURNAL_SVG_LAYER_NAME_ATTR)
      );
      this.addAtIndex(layer, idx);
    }
    for (let layer of this.removed) { this.pageCanvas.removeChild(layer) }
    this.setListAttributes(this.listAfter);
    this.updateList();
  }

  private setListAttributes(
    list: { name: string, current: boolean, visible: boolean }[]
  ) {
    console.log(list);
    for (let layerInfo of list) {
      const layer = Array.from(this.pageCanvas.children)
        .find(c => c.getAttribute(WOURNAL_SVG_LAYER_NAME_ATTR) === layerInfo.name);
      layer.setAttribute(WOURNAL_SVG_LAYER_CURRENT_ATTR, String(layerInfo.current));
      layer.setAttribute('visibility', layerInfo.visible ? 'visible' : 'hidden');
    }
  }

  private addAtIndex(
    el: SVGGElement, index: number
  ) {
    const next = this.pageCanvas.children[index + 1];
    if (next) next.before(el);
    else this.pageCanvas.appendChild(el);
  }
}

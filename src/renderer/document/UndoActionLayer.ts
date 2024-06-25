import { UndoAction } from "./UndoStack";
import { WOURNAL_SVG_LAYER_CURRENT_ATTR, WOURNAL_SVG_LAYER_NAME_ATTR } from "./WournalPage";

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
    // LOG.info(list);
    for (let i = 0; i < list.length; i++) {
      const layer = this.pageCanvas.children[i];
      layer.setAttribute(WOURNAL_SVG_LAYER_CURRENT_ATTR, String(list[i].current));
      layer.setAttribute(WOURNAL_SVG_LAYER_NAME_ATTR, list[i].name);
      layer.setAttribute('visibility', list[i].visible ? 'visible' : 'hidden');
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

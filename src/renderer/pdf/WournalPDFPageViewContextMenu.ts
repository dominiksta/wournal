import { Component, rx } from '@mvui/core';
import * as ui5 from '@mvui/ui5';

@Component.register
export default class WournalPDFPageViewContextMenu extends Component {
  private readonly menuRef = this.ref<ui5.types.Menu>();
  private lastMousePos: { x: number, y: number } = { x: 0, y: 0 };
  private lastSelection = '';
  private lastSelectionDim: DOMRect[] = [];

  public events = new rx.MulticastStream<
    { mouse: { x: number, y: number } } &
    (
      {
        type: 'highlight' | 'strikethrough' | 'underline',
        data: { text: string, dim: DOMRect[] }
      }
      |
      {
        type: 'copy', data: string
      }
    )
  >();

  render() {
    return [
      ui5.menu({
        ref: this.menuRef,
        events: {
          'item-click': e => {
            const id = e.detail.item.id;
            switch(id) {
              case 'copy':
                this.events.next({
                  mouse: this.lastMousePos, type: 'copy', data: this.lastSelection
                });
                break;
              case 'highlight':
              case 'underline':
              case 'strikethrough':
                this.events.next({
                  mouse: this.lastMousePos,
                  type: id,
                  data: { dim: this.lastSelectionDim, text: this.lastSelection }
                });
                break;
              default: throw new Error();
            }
          }
        }
      }, [
        ui5.menuItem({ fields: {
          icon: 'copy', id: 'copy', text: 'Copy',
        }}),
        ui5.menuItem({ fields: {
          icon: 'wournal/highlighter', id: 'highlight', text: 'Highlight',
        }}),
        ui5.menuItem({ fields: {
          icon: 'underline-text', id: 'underline', text: 'Underline',
        }}),
        ui5.menuItem({ fields: {
          icon: 'strikethrough', id: 'strikethrough', text: 'Strikethrough',
        }}),
      ])
    ]
  }

  show(point: {x: number, y: number}, sel: Selection) {
    if (sel.rangeCount === 0 || sel.toString() === '') return;
    this.lastSelection = sel.toString();
    this.lastSelectionDim = Array.from(sel.getRangeAt(0).getClientRects());
    this.lastMousePos = point;
    // hacky hack hack
    const fiction = document.createElement('div');
    fiction.style.position = 'fixed';
    fiction.style.top = `${point.y}px`;
    fiction.style.left = `${point.x}px`;
    document.body.append(fiction);

    this.menuRef.current.showAt(fiction);

    setTimeout(() => {
      fiction.remove();
    }, 500);
  }
}

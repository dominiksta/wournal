import { Component } from '@mvui/core';
import * as ui5 from '@mvui/ui5';
import { inject } from 'dependency-injection';

@Component.register
export default class WournalPDFPageViewContextMenu extends Component {
  private readonly menuRef = this.ref<ui5.types.Menu>();
  private lastSelection = '';

  render() {
    return [
      ui5.menu({
        ref: this.menuRef,
        events: {
          'item-click': e => {
            const id = e.detail.item.id;
            switch(id) {
              case 'copy':
                navigator.clipboard.writeText(this.lastSelection);
                break;
              default: throw new Error();
            }
          }
        }
      }, [
        ui5.menuItem({
          fields: {
            icon: 'copy', id: 'copy', text: 'Copy',
          }
        })
      ])
    ]
  }

  show(point: {x: number, y: number}) {
    this.lastSelection = getSelection().toString()
    if (this.lastSelection === '') return;
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

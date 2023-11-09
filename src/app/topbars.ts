import { Component, h, rx, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import Toolbar, { ToolbarButton, ToolbarSeperator } from "../common/toolbar";
import { Wournal } from "../document/Wournal";

@Component.register
export default class TopBars extends Component {
  props = {
    wournal: rx.prop<Wournal>(),
  }

  render() {
    const w = this.props.wournal.value;

    return [
      h.div({ fields: { className: 'topbar' } }, [
        ui5.toolbar({ fields: { alignContent: 'Start' }}, [
          ui5.toolbarButton({
            fields: {
              icon: 'menu2',
              title: 'Menu',
            },
            events: {
              click: e => console.log(e),
            }
          }),
          ui5.toolbarSeparator(),
          ui5.toolbarButton({
            fields: {
              icon: 'save',
              title: 'Save',
            },
            events: {
              click: _ => w.saveDocument(),
            }
          })
        ])

        // Toolbar.t([
        //   ToolbarButton.t({
        //     props: {
        //       img: 'res/remix/menu-line.svg',
        //       alt: 'Menu',
        //     },
        //     events: {
        //       click: v => console.log(v),
        //     }
        //   }),
        //   ToolbarSeperator.t(),
        //   ToolbarButton.t({
        //     props: {
        //       img: 'res/remix/save-3-line.svg',
        //       alt: 'Save'
        //     },
        //     events: {
        //       click: _ => w.saveDocument(),
        //     }
        //   }),
        // ])
      ])
    ]
  }
}

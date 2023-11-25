import { Component, rx, h, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { BasicDialogManagerContext } from "common/dialog-manager";
import { WournalDocument } from "document/WournalDocument";
import { WournalPage } from "document/WournalPage";
import { ApiCtx } from "./api-context";
import { GlobalCommand, GlobalCommandIdT, GlobalCommandsCtx } from "./global-commands";
import { pageStyleDialog } from "./page-style-dialog";
import { ShortcutsCtx } from "./shortcuts-context";

@Component.register
export class StatusBar extends Component {
  props = {
    doc: rx.prop<WournalDocument>()
  }

  private gotoPageRef = this.ref<ui5.types.Input>();
  focusGotoPage() {
    this.gotoPageRef.current?.focus();
    this.gotoPageRef.current?.shadowRoot.querySelector('input').select();
  }

  render() {
    const { doc } = this.props;

    const activePage = doc.pipe(rx.switchMap(d => d.activePage));
    const pages = doc.pipe(rx.switchMap(d => d.pages));

    const activePageNr =
      rx.combineLatest(activePage, pages).map(([act, p]) => p.indexOf(act) + 1);

    const shortcutCtx = this.getContext(ShortcutsCtx);
    const globalCmds = this.getContext(GlobalCommandsCtx);
    const api = this.getContext(ApiCtx);

    const btnTitle = (cmd: GlobalCommandIdT) =>
      `${globalCmds[cmd].human_name} (${globalCmds[cmd].shortcut})`;

    const layerEditor = this.ref<LayerEditor>();
    const currentLayer = activePage.pipe(
      rx.switchMap(p => p.layers),
      rx.map(layers => layers.find(l => l.current).name)
    );

    return [
      ui5.button({
        fields: {
          icon: 'close-command-field', design: 'Transparent',
          title: btnTitle('scroll_page_first')
        },
        events: { click: globalCmds.scroll_page_first.func }
      }),
      ui5.button({
        fields: {
          icon: 'navigation-left-arrow', design: 'Transparent',
          title: btnTitle('scroll_page_previous')
        },
        events: { click: globalCmds.scroll_page_previous.func }
      }),
      h.span('Page '),
      ui5.input({
        ref: this.gotoPageRef,
        fields: { value: activePageNr.map(n => n.toString()) },
        events: {
          change: e => {
            const target = e.target as ui5.types.Input;
            let n = parseFloat(target.value);
            if (isNaN(n)) n = api.getPageNr();
            const newNr = Math.max(1, Math.min(n, api.getPageCount()));
            api.scrollPage(newNr);
            shortcutCtx.focus();
          }
        },
        style: {
          maxWidth: '40px',
          textAlign: 'center',
          fontSize: '90%',
        }
      }),
      h.span(pages.map(p => ' of ' + p.length)),
      // h.span(doc.derive(d => d.)),
      ui5.button({
        fields: {
          icon: 'navigation-right-arrow', design: 'Transparent',
          title: btnTitle('scroll_page_next')
        },
        events: { click: globalCmds.scroll_page_next.func }
      }),
      ui5.button({
        fields: {
          icon: 'open-command-field', design: 'Transparent',
          title: btnTitle('scroll_page_last')
        },
        events: { click: globalCmds.scroll_page_last.func }
      }),
      h.span({ fields: { className: 'separator' }}),
      ui5.button({
        fields: {
          icon: 'slim-arrow-up', design: 'Transparent',
        },
        events: {
          click: e => {
            if (layerEditor.current.open)
              layerEditor.current.close();
            else
              layerEditor.current.showAt(e.target as ui5.types.Button);
          }
        }
      }),
      h.span(currentLayer),
      LayerEditor.t({ ref: layerEditor, props: { page: activePage }}),
    ]
  }

  static styles = style.sheet({
    ':host': {
      padding: '1px 0px',
      fontSize: '80%',
      display: 'block',
      position: 'fixed',
      bottom: '0',
      width: '100%',
      zIndex: '2',
      borderTop: `1px solid ${ui5.Theme.PageFooter_BorderColor}`,
      background: ui5.Theme.PageFooter_Background,
    },
    ':host > *': {
      marginLeft: '3px',
    },
    'span': {
      verticalAlign: 'middle',
    },
    '.separator': {
      borderLeft: `1px solid ${ui5.Theme.Button_BorderColor}`,
      marginRight: '.4em',
    }
  })
}


@Component.register
class LayerEditor extends Component {
  props = {
    page: rx.prop<WournalPage>(),
  }

  #popover = this.ref<ui5.types.Popover>();
  get open() { return this.#popover.current.open }
  showAt(el: HTMLElement) { this.#popover.current.showAt(el); }
  close() { this.#popover.current.close(); }

  render() {
    const { page } = this.props;

    const layers = page.pipe(rx.switchMap(p => p.layers));

    const api = this.getContext(ApiCtx);
    const globalCmnds = this.getContext(GlobalCommandsCtx);
    const dialog = this.getContext(BasicDialogManagerContext);

    // const layers = new rx.State<any>([]);
    // layers.subscribe(l => console.log(l.map(l => l.name)));
    // setInterval(() => {
    //   console.log(page.value.layers.value);
    // }, 1000)
    //
    return [
      ui5.popover({
        ref: this.#popover,
        fields: {
          headerText: 'Layers', allowTargetOverlap: true,
          placementType: 'Top',
        }
      }, [
        h.table(layers.map(layers => layers.slice().reverse().map(layer => h.tr([
          h.td(layer.name),
          h.td([
            ui5.checkbox({
              fields: { text: 'Show', checked: layer.visible },
              events: {
                change: _ => {
                  const visible = api.getLayerStatus().find(
                    l => l.name === layer.name
                  ).visible;
                  api.setLayerVisible(layer.name, !visible);
                },
              }
            }),
          ]),
          h.td([
            ui5.radioButton({
              fields: {
                text: 'Current', checked: layer.current,
                name: 'Radio ' + layer.name,
                disabled: layer.name === 'Background',
              },
              events: {
                change: _ => api.setActiveLayer(layer.name),
              }
            }),
          ]),
          h.td([
            ui5.button({
              fields: {
                icon: 'paint-bucket', design: 'Transparent',
                hidden: layer.name !== 'Background',
              },
              events: {
                click: _ => {
                  globalCmnds.page_set_style.func();
                }
              }
            }, 'Set Background'),
            ui5.button({
              fields: {
                icon: 'arrow-top', design: 'Transparent',
                hidden: layer.name === 'Background',
              },
              events: {
                click: _ => api.moveLayer(layer.name, 'up')
              }
            }),
            ui5.button({
              fields: {
                icon: 'arrow-bottom', design: 'Transparent',
                hidden: layer.name === 'Background',
              },
              events: {
                click: _ => api.moveLayer(layer.name, 'down')
              }
            }),
            ui5.button({
              fields: {
                icon: 'text', design: 'Transparent',
                hidden: layer.name === 'Background',
              },
              events: {
                click: async _ => {
                  const resp = await dialog.promptInput('Rename Layer');
                  if (resp === '' || !resp) return;
                  api.renameLayer(layer.name, resp);
                }
              }
            }),
            ui5.button({
              fields: {
                icon: 'delete', design: 'Transparent',
                disabled: layers.length <= 2,
                hidden: layer.name === 'Background',
              },
              events: {
                click: async _ => {
                  const resp = await dialog.promptYesOrNo(
                    'Warning',
                    `Please confirm deletion of layer '${layer.name}'?`
                  );
                  if (resp) api.deleteLayer(layer.name);
                }
              }
            })
          ])
        ])))),
        ui5.button({
          fields: { icon: 'add' },
          events: {
            click: _ => api.newLayer(),
          }
        }, 'New Layer'),
        // ui5.button('Show All'),
        // ui5.button('Hide All'),
      ])
    ]
  }

}

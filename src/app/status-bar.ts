import { Component, rx, h, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { WournalDocument } from "document/WournalDocument";
import { ApiCtx } from "./api-context";
import { GlobalCommand, GlobalCommandIdT, GlobalCommandsCtx } from "./global-commands";
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
      background: ui5.Theme.BackgroundColor,
    },
    ':host > *': {
      marginLeft: '3px',
    }
  })
}

import { Component, h, rx, style } from '@mvui/core';
import './global-styles';
import * as ui5 from "@mvui/ui5";
import Toolbars from 'app/toolbars';
import { Wournal } from 'document/Wournal';
import { darkTheme, lightTheme, theme } from "./global-styles";
import { WournalDocument } from "document/WournalDocument";

@Component.register
class App extends Component {
  private wournal = new Wournal(document.createElement('div'), 'browser');

  constructor() {
    super();
    this.wournal.init();
  }

  render() {
    this.subscribe(style.currentTheme$, theme => {
      ui5.config.setTheme(theme === 'light' ? 'sap_horizon' : 'sap_horizon_dark');
      style.setTheme('wournal', theme === 'light' ? lightTheme : darkTheme);
    });

    return [
      Toolbars.t({ props: { wournal: this.wournal } }),
      h.div({
        fields: { id: 'document' },
      },
        this.wournal.display
      ),
    ]
  }

  static styles = style.sheet({
    ':host': {
      background: theme.background,
      display: 'block',
      height: '100%',
    },
    [Toolbars.tagName]: {
      position: 'fixed',
      top: '0',
      width: '100%',
      zIndex: '1000',
      background: theme.background,
    },
    '#document': {
      position: 'relative',
      top: '87px',
      background: theme.background,
      height: 'calc(100% - 87px)',
      width: '100%',
    },
    '#document > div': {
      overflow: 'auto',
      height: '100%',
      width: '100%',
    }
  });
}



document.body.appendChild(new App());

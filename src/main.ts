import { Component, h, rx, style } from '@mvui/core';
import './global-styles';
import * as ui5 from "@mvui/ui5";
import Toolbars from 'app/toolbars';
import { darkTheme, lightTheme, theme } from "./global-styles";
import { WournalDocument } from "document/WournalDocument";
import { ConfigRepositoryLocalStorage } from 'persistence/ConfigRepositoryLocalStorage';
import { DocumentRepositoryBrowserFiles } from 'persistence/DocumentRepositoryBrowserFiles';
import { WournalPageSize } from 'document/WournalPageSize';
import { defaultConfig } from 'persistence/ConfigDTO';

export const ConfigCtx = new rx.Context(() => new rx.State(defaultConfig()));

@Component.register
class App extends Component {

  private docRepo = DocumentRepositoryBrowserFiles.getInstance();
  private confRepo = ConfigRepositoryLocalStorage.getInstance();

  private configCtx = this.provideContext(ConfigCtx);
  private doc = new rx.State(WournalDocument.create(this.configCtx));

  constructor() {
    super();
  }

  render() {
    this.configCtx.next(this.confRepo.load());

    this.subscribe(style.currentTheme$, theme => {
      ui5.config.setTheme(theme === 'light' ? 'sap_horizon' : 'sap_horizon_dark');
      style.setTheme('wournal', theme === 'light' ? lightTheme : darkTheme);
    });

    this.createTestPages();

    return [
      Toolbars.t({ props: { doc: this.doc } }),
      h.div({
        fields: { id: 'document' },
      },
        this.doc
      ),
    ]
  }

  async loadDocument(empty: boolean = false) {
    this.doc.next(
      empty
        ? WournalDocument.create(this.configCtx)
        : WournalDocument.fromDto(this.configCtx, await this.docRepo.load(""))
    );
  }

  saveDocument() {
    this.docRepo.save(this.doc.value.toDto());
  }

  private createTestPages() {
    this.doc.value.addNewPage(WournalPageSize.DINA4_LANDSCAPE);
    this.doc.value.addNewPage(WournalPageSize.DINA5_PORTRAIT);
    this.doc.value.addNewPage(WournalPageSize.DINA5_LANDSCAPE);
  }

  static styles = style.sheet({
    ':host': {
      background: ui5.Theme.BackgroundColor,
      display: 'block',
      height: '100%',
    },
    [Toolbars.tagName]: {
      position: 'fixed',
      top: '0',
      width: '100%',
      zIndex: '1000',
      background: ui5.Theme.BackgroundColor,
    },
    '#document': {
      position: 'relative',
      top: '87px',
      background: theme.documentBackground,
      height: 'calc(100% - 87px)',
      width: '100%',
      overflow: 'auto',
    },
    '#document > div': {
      overflow: 'auto',
      height: '100%',
      width: '100%',
    },
    '*::-webkit-scrollbar': {
      // background: ui5.Theme.ScrollBar_TrackColor,
      background: 'transparent',
      // width: ui5.Theme.ScrollBar_Dimension,
      // height: ui5.Theme.ScrollBar_Dimension,
      width: '8px',
      height: '8px',
    },
    '*::-webkit-scrollbar-thumb': {
      background: theme.scrollbar,
      borderRadius: '10px',
    },
    '*::-webkit-scrollbar-thumb:hover': {
      background: theme.scrollbarHover,
    },
    '*::-webkit-scrollbar-corner': {
      // background: ui5.Theme.ScrollBar_TrackColor,
      background: 'transparent',
    },
  });
}



document.body.appendChild(new App());

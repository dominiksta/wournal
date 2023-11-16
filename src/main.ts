import { Component, h, rx, style } from '@mvui/core';
import './global-styles';
import * as ui5 from "@mvui/ui5";
import Toolbars from 'app/toolbars';
import { darkTheme, lightTheme, theme } from "./global-styles";
import { WournalDocument } from "document/WournalDocument";
import { ConfigRepositoryLocalStorage } from 'persistence/ConfigRepositoryLocalStorage';
import { DocumentRepositoryBrowserFiles } from 'persistence/DocumentRepositoryBrowserFiles';
import { WournalPageSize } from 'document/WournalPageSize';

@Component.register
class App extends Component {

  private docRepo = DocumentRepositoryBrowserFiles.getInstance();
  private configRepo = ConfigRepositoryLocalStorage.getInstance();
  private appConfig = new rx.State(this.configRepo.load());

  private doc = new rx.State(WournalDocument.create(this.appConfig));

  constructor() {
    super();
  }

  render() {
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
        ? WournalDocument.create(this.appConfig)
        : WournalDocument.fromDto(this.appConfig, await this.docRepo.load(""))
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
      overflow: 'auto',
    },
    '#document > div': {
      overflow: 'auto',
      height: '100%',
      width: '100%',
    }
  });
}



document.body.appendChild(new App());

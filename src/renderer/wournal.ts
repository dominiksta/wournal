import { Component, h, rx, style } from '@mvuijs/core';
import './global-styles';
import './app/debugger';
import * as ui5 from "@mvuijs/ui5";
import Toolbars from 'app/toolbars';
import { darkTheme, lightTheme } from "./global-styles";
import { WournalDocument } from "document/WournalDocument";
import { WournalPageSize } from 'document/WournalPageSize';
import { ConfigCtx } from 'app/config-context';
import { Settings } from 'app/settings';
import { ToastCtx } from 'app/toast-context';
import { Shortcut, ShortcutManager } from 'app/shortcuts';
import { ShortcutsCtx } from 'app/shortcuts-context';
import { WournalApi } from 'api';
import { ApiCtx } from 'app/api-context';
import { DocumentCtx } from 'app/document-context';
import { GlobalCommand, GlobalCommandIdT, GlobalCommandsCtx } from 'app/global-commands';
import { CanvasToolName } from 'document/CanvasTool';
import { CanvasToolFactory } from 'document/CanvasToolFactory';
import { StatusBar } from 'app/status-bar';
import { BasicDialogManagerContext } from 'common/dialog-manager';
import { DSUtils } from 'util/DSUtils';
import { pageStyleDialog } from 'app/page-style-dialog';
import { FileUtils } from 'util/FileUtils';
import { ApiClient } from 'electron-api-client';
import { inject } from 'dependency-injection';
import About from 'app/about';
import { FileNotFoundError } from 'pdf/PDFCache';
import { CanvasToolStrokeWidth, ConfigDTO, defaultConfig } from 'persistence/ConfigDTO';
import PDFExporter from 'pdf/PDFExporter';
import openSystemDebugInfo from 'app/debug-info';
import setupAutosave from 'document/autosave';
import RecentFiles from 'persistence/recent-files';
import { debounce } from 'lodash';
import { checkDisplayUpdates, compareVersionStrings, getGithubReleases } from 'app/updater';
import PackageJson from 'PackageJson';
import { getLogger, logFunction, logObject } from 'Shared/logging';
import { PageProps } from 'document/WournalPage';
import environment from 'Shared/environment';
import { SVGUtils } from 'util/SVGUtils';
import { AUTOSAVE_DIR } from 'Shared/const';
import { LastPages } from 'document/last-pages';
import { TabBar, TabDef } from 'common/tab-bar';
import DocumentDisplay from './document-display';
import IdCounter from 'util/id-counter';

const LOG = getLogger(__filename);

@Component.register
export default class Wournal extends Component {

  constructor(config: ConfigDTO) {
    super();
    this.configCtx.next(config);
  }

  private fileSystem = inject('FileSystem');
  private confRepo = inject('ConfigRepository');

  private configCtx =
    this.provideContext(ConfigCtx, new rx.State(defaultConfig()));
  public shortcutsCtx =
    this.provideContext(ShortcutsCtx, new ShortcutManager());

  private hideSideBar = new rx.State(true, 'Wournal:hideSideBar');
  private hideSearchBox = new rx.State(true, 'Wournal:hideSearchBox');

  private toast = this.provideContext(ToastCtx, {
    open: async (msg: string) => {
      LOG.debug(`Showing Toast Message: ${msg}`);
      const toast = await this.query<ui5.types.Toast>('#toast');
      toast.innerText = msg;
      toast.show();
    }
  });

  public api: WournalApi = this.provideContext(ApiCtx, logObject({
    // document
    // ----------------------------------------------------------------------
    saveDocumentPromptSinglePage: async (defaultIdentification: string) => {
      const doc = this.currDoc.value
      if (doc.pages.value.length > 1) {
        this.dialog.infoBox(
          'Warning',
          'This document has multiple pages and can therefore not be saved ' +
          'as a single-page SVG file. Consider saving as a WOJ file instead.',
          'Warning'
        );
        return;
      }
      const resp = await this.fileSystem.savePrompt(defaultIdentification, [
        { extensions: ['svg'], name: 'SVG File (Single-Page) (.svg)' },
        { extensions: ['*'], name: 'All Files' },
      ]);
      if (!resp) return false;
      doc.isSinglePage = true;
      await this.api.saveDocument(resp);
      return resp;
    },
    saveDocumentPromptMultiPage: async (defaultIdentification: string) => {
      const resp = await this.fileSystem.savePrompt(defaultIdentification, [
        { extensions: ['woj'], name: 'Wournal File (Multi-Page) (.woj)' },
        { extensions: ['*'], name: 'All Files' },
      ]);
      if (!resp) return false;
      await this.api.saveDocument(resp);
      return resp;
    },
    saveDocument: async (identification: string) => {
      const doc = this.currDoc.value;
      await this.fileSystem.write(identification, await doc.toFile());
      doc.fileName = identification;
      doc.meta.next(m => ({ ...m, lastSavedTime: new Date().toISOString() }));
      doc.markSaved();
      this.openDocs.next(v => [...v]);
      updateTitle(doc, this.activeTabId.value);
      this.toast.open('Document Saved');
    },
    loadDocumentPrompt: async () => {
      const userResp = await this.fileSystem.loadPrompt([
        { extensions: ['woj', 'pdf', 'svg'], name: 'All Supported Types (.woj/.pdf/.svg)' },
        { extensions: ['woj'], name: 'Wournal File (Multi-Page) (.woj)' },
        { extensions: ['pdf'], name: 'Portable Document Format (.pdf)' },
        { extensions: ['svg'], name: 'Scalable Vector Graphics (Single-Page) (.svg)' },
        { extensions: ['*'], name: 'All Files' },
      ]);
      if (!userResp) return false;
      await this.api.loadDocument(userResp);
      return true;
    },
    loadDocument: async (fileName: string) => {
      this.flushLastPages();
      LOG.info('loading file: ' + fileName);
      RecentFiles.add(fileName);
      // this.doc.next(WournalDocument.create(this.getContext.bind(this)));
      const closePleaseWait = this.dialog.pleaseWait(
        'Loading Document',
      );
      await new Promise(resolve => setTimeout(resolve, 100));

      if (
        this.configCtx.value.autoOpenWojWithSameNameAsPDF &&
        fileName.toLowerCase().endsWith('.pdf')
      ) {
        const wojFile = FileUtils.fileNameBase(fileName) + '.woj';
        if (await this.fileSystem.exists(wojFile)) {
          this.toast.open(
            `Loading associated WOJ file for ` +
            `'${FileUtils.fileNameNoPath(fileName)}'`
          );
          fileName = wojFile;
        }
      }

      const blob = await this.fileSystem.read(fileName);
      if (!blob) {
        closePleaseWait();
        return false;
      }
      let pdfNotFoundActions: {
        fileName: string, replaceOrRemove: string | false
      }[] = [];
      let doc = await WournalDocument.fromFile(
        this.getContext.bind(this), fileName, blob, pdfNotFoundActions
      );
      while (doc instanceof FileNotFoundError) {
        const pdfFile =
          FileUtils.fileNameBase(FileUtils.fileNameNoPath(fileName)) + '.pdf';
        const wojDir = FileUtils.fileNamePath(fileName);

        const inDir = (await this.fileSystem.ls(wojDir)).map(FileUtils.fileNameNoPath);
        LOG.info('pdf not found: ' + doc.fileName);
        if (inDir.includes(pdfFile)) {
          LOG.info('pdf found in same dir: ', { fileName, wojDir, pdfFile });
          pdfNotFoundActions.push({
            fileName: doc.fileName,
            replaceOrRemove: wojDir + FileUtils.SEP + pdfFile,
          });
        } else {
          LOG.info('prompting user for new pdf location');
          const resp = await new Promise<string | false>(resolve => this.dialog.openDialog(
            _close => ({
              heading: 'PDF Not Found!',
              state: 'Error',
              content: h.section([
                `The PDF file "${doc.fileName}" was not found. ` +
                'It may have been moved, deleted or renamed.'
              ]),
              buttons: [
                {
                  name: 'Choose other PDF', action: async () => {
                    resolve(await this.fileSystem.loadPrompt([
                      { extensions: ['pdf'], name: 'Portable Document Format (PDF)' },
                      { extensions: ['*'], name: 'All Files' },
                    ]));
                  }
                },
                { name: 'Remove PDF Background', action: () => resolve(false) },
              ],
            })
          ));
          pdfNotFoundActions.push({ fileName: doc.fileName, replaceOrRemove: resp });
        }

        LOG.info('pdfNotFoundActions', pdfNotFoundActions);
        doc = await WournalDocument.fromFile(
          this.getContext.bind(this), fileName, blob, pdfNotFoundActions
        );
      }
      for (const openDoc of this.openDocs.value) {
        if (doc.fileName !== undefined && openDoc.doc.fileName === doc.fileName) {
          this.dialog.infoBox(
            'Same Document Already Open', (
              'You cannot open the same document twice in the same instance of ' +
              'Wournal'
            ),
            'Warning',
          );
          closePleaseWait();
          return true;
        }
      }

      if (doc.isSinglePage) this.toast.open(
        'This is a single page document (SVG). You will not be able to add ' +
        'pages unless you save as a .woj file'
      )
      const tabId = this.tabIds.nextId().toString()
      this.openDocs.next(v => [...v, { id: tabId, doc: doc as WournalDocument }]);
      this.activeTabId.next(tabId);
      closePleaseWait();
      const lastPage = LastPages.get(fileName);
      if (lastPage !== false) this.api.scrollPage(lastPage);
      this.shortcutsCtx.focus();
      return true;
    },
    newDocument: async (props: PageProps, identification: string) => {
      const doc = WournalDocument.create(this.getContext.bind(this), props);
      const tabId = this.tabIds.nextId().toString();
      this.openDocs.next(docs => [...docs, { id: tabId, doc } ]);
      this.activeTabId.next(tabId);
      if (identification) {
        doc.fileName = identification;
        updateTitle(doc, this.activeTabId.value);
        doc.isSinglePage = identification.endsWith('.svg');
        LOG.info('new document', [ identification, doc.isSinglePage ]);
      }
    },
    closeDocumentPrompt: async () => {
      if (await this.api.promptClosingUnsaved()) return false;
      const currDoc = this.currDoc.value;
      const openDocs = this.openDocs.value;
      if (openDocs.length === 1) {
        this.openDocs.next([{
          id: this.tabIds.nextId().toString(),
          doc: WournalDocument.create(this.getContext.bind(this))
        }]);
      } else {
        const idx = openDocs.findIndex(od => od.doc === currDoc)
        if (idx !== 0) this.activeTabId.next(openDocs[idx - 1].id);
        this.openDocs.next(od => [...od.slice(0, idx), ...od.slice(idx + 1)]);
      }
      currDoc.free();
      return true;
    },
    getDocumentId: () => this.currDoc.value.fileName ?? false,
    createTestPages: () => {
      this.currDoc.value.addNewPage({
        width: WournalPageSize.DINA4.height,
        height: WournalPageSize.DINA4.width,
        backgroundColor: '#FFFFFF',
        backgroundStyle: 'ruled',
      });
      this.currDoc.value.addNewPage({
        ...WournalPageSize.DINA5, backgroundColor: '#FFFFFF',
        backgroundStyle: 'blank'
      });
      this.currDoc.value.addNewPage({
        ...WournalPageSize.DINA5, backgroundColor: '#FFFFFF',
        backgroundStyle: 'graph'
      });
    },
    promptClosingUnsaved: async () => {
      this.flushLastPages();
      const doc = this.currDoc.value;
      if (!doc.dirty) return false;
      return new Promise<boolean>(resolve => {
        this.dialog.openDialog(close => ({
          heading: 'Warning',
          state: 'Warning',
          content: 'This document is not saved yet.',
          buttons: [
            {
              name: 'Save', design: 'Emphasized', icon: 'save',
              action: async () => {
                close();
                const resp: string | false = await this.#globalCmds.file_save.func();
                resolve(typeof resp !== 'string');
              },
            },
            {
              name: 'Discard', design: 'Negative', icon: 'delete',
              action: () => { close(); resolve(false); },
            },
            {
              name: 'Cancel', design: 'Default', icon: 'cancel',
              action: () => { close(); resolve(true); },
            },
          ],
        }));
      });
    },
    closeDocumentPromptAll: async () => {
      for (const doc of this.openDocs.value) {
        if (!doc.doc.dirty) continue;
        this.activeTabId.next(doc.id);
        if (!await this.api.closeDocumentPrompt()) return false;
      }
      return true;
    },
    promptExportPDF: async () => {
      const doc = this.currDoc.value;
      const resp = await this.fileSystem.savePrompt(
        doc.fileName !== undefined
          ? (doc.fileName + '.pdf')
          : doc.defaultFileName('woj.pdf'),
        [
          { extensions: ['pdf'], name: 'Portable Document Format (.pdf)' },
          { extensions: ['*'], name: 'All Files' },
        ]
      );
      if (!resp) return false;
      const closePleaseWait = this.dialog.pleaseWait('Exporting Document');
      await this.fileSystem.write(
        resp, new Blob([await new PDFExporter().exportDocument(doc)])
      );
      closePleaseWait();
      this.toast.open('Document Exported');
      return true;
    },

    // history
    // ----------------------------------------------------------------------
    undo: () => { this.currDoc.value.undo() },
    redo: () => { this.currDoc.value.redo() },

    // clipboard/selection
    // ----------------------------------------------------------------------
    pasteClipboard: () => { this.currDoc.value.pasteClipboard() },
    cutSelection: () => { this.currDoc.value.selectionCut() },
    copySelection: () => { this.currDoc.value.selectionCopy() },
    deleteSelection: () => { this.currDoc.value.selectionCut(true) },

    // jumplist
    // ----------------------------------------------------------------------
    jumplistPrev: () => { this.currDoc.value.jumplistPrev() },
    jumplistNext: () => { this.currDoc.value.jumplistNext() },
    jumplistMark: () => { this.currDoc.value.jumplistAdd(this.currDoc.value.activePage.value) },

    // zoom
    // ----------------------------------------------------------------------
    setZoom: (zoom: number) => { this.currDoc.value.setZoom(zoom) },
    getZoom: () => { return this.currDoc.value.getZoom(); },
    setZoomFitWidth: () => {
      const idx = this.api.getCurrentPageNr();
      this.currDoc.value.setZoomFitWidth();
      this.currDoc.value.setActivePageForCurrentScroll();
      if (idx !== this.api.getCurrentPageNr()) this.api.scrollPage(idx);
    },

    // tools
    // ----------------------------------------------------------------------
    setTool: (tool: CanvasToolName) => {
      this.currDoc.value.setTool(CanvasToolFactory.forName(tool));
    },
    getTool: () => {
      return this.currDoc.value.currentTool.value.name;
    },
    setStrokeWidth: (width: CanvasToolStrokeWidth) => {
      this.currDoc.value.setStrokeWidth(width);
    },
    setColorByName: (name: string) => {
      this.currDoc.value.setColor(
        this.configCtx.value.colorPalette.find(c => c.name === name).color
      );
    },
    setColorByHex: (color: string) => {
      this.currDoc.value.setColor(color);
    },
    setFont: (opt: {
      family: string, size: number, weight: 'normal' | 'bold',
      style: 'normal' | 'italic'
    }) => {
      const newCfg = DSUtils.copyObj(this.currDoc.value.toolConfig.value);
      newCfg.CanvasToolText.fontFamily = opt.family;
      newCfg.CanvasToolText.fontSize = opt.size;
      newCfg.CanvasToolText.fontStyle = opt.style;
      newCfg.CanvasToolText.fontWeight = opt.weight;
      this.currDoc.value.toolConfig.next(newCfg);
    },
    getFont: () => {
      const cfg = this.currDoc.value.toolConfig.value.CanvasToolText;
      return {
        family: cfg.fontFamily,
        size: cfg.fontSize,
        style: cfg.fontStyle,
        weight: cfg.fontWeight,
      }
    },

    // scroll
    // ----------------------------------------------------------------------
    scrollPage: (page: number) => {
      page -= 1;
      const doc = this.currDoc.value; const pages = doc.pages.value;
      if (page < 0 || page >= pages.length) return;
      doc.activePage.next(pages[page]);
      const prevScrollPos = this.api.getScrollPos();
      const pagePos = pages[page].display.getBoundingClientRect();
      const viewport = this.currDocDisplay.document.getBoundingClientRect();

      if (SVGUtils.rectIntersect(viewport, pagePos)) return;
      const pagePosInViewPort = pagePos.top - viewport.top;
      this.api.scrollPos(prevScrollPos.top + pagePosInViewPort, prevScrollPos.left);
    },
    scrollPos: (top: number, left: number) => {
      this.currDocDisplay.document.scrollTop = top;
      this.currDocDisplay.document.scrollLeft = left;
    },
    getScrollPos: () => {
      console.log(this.currDocDisplay);
      return {
        top: this.currDocDisplay.document.scrollTop,
        left: this.currDocDisplay.document.scrollLeft,
      }
    },

    // layers
    // ----------------------------------------------------------------------
    newLayer: (name: string) => {
      this.currDoc.value.activePage.value.addLayer(name);
    },
    setActiveLayer: (name: string) => {
      this.currDoc.value.activePage.value.setActivePaintLayer(name);
    },
    getLayerStatus: () => {
      return this.currDoc.value.activePage.value.layers.value;
    },
    setLayerVisible: (name: string, visible: boolean) => {
      return this.currDoc.value.activePage.value.setLayerVisible(name, visible);
    },
    deleteLayer: (name: string) => {
      return this.currDoc.value.activePage.value.deleteLayer(name);
    },
    moveLayer: (name: string, direction: 'up' | 'down') => {
      return this.currDoc.value.activePage.value.moveLayer(name, direction);
    },
    renameLayer: (name: string, newName: string) => {
      this.currDoc.value.activePage.value.renameLayer(name, newName);
    },

    // page manipulation
    // ----------------------------------------------------------------------
    getCurrentPageNr: () => {
      return this.currDoc.value.pages.value.indexOf(this.currDoc.value.activePage.value) + 1;
    },
    getPageCount: () => {
      return this.currDoc.value.pages.value.length;
    },
    setPageProps: (props: PageProps) => {
      this.currDoc.value.activePage.value.setPageProps(props);
    },
    setPagePropsPrompt: async () => {
      const page = this.currDoc.value.activePage.value;
      const resp = await pageStyleDialog(
        this.dialog.openDialog, DSUtils.copyObj(page.getPageProps())
      );
      if (resp) this.api.setPageProps(resp);
    },
    addPage: (addAfterPageNr: number, props: PageProps) => {
      if (!this.checkSinglePage()) return;
      this.currDoc.value.addNewPage(props, addAfterPageNr);
    },
    deletePage: (pageNr: number) => {
      if (!this.checkSinglePage()) return;
      this.currDoc.value.deletePage(pageNr);
    },
    getPageProps: (pageNr: number) => {
      const page = this.currDoc.value.pages.value[pageNr - 1];
      return page.getPageProps();
    },
    movePage: (pageNr: number, direction: 'up' | 'down') => {
      if (!this.checkSinglePage()) return;
      this.currDoc.value.movePage(pageNr, direction);
    },
  }, 'wournal-api-call'))

  private checkSinglePage() {
    if (this.currDoc.value.isSinglePage) {
      this.dialog.infoBox(
        'Warning',
        'Operation Disabled in Single Page Documents',
        'Warning',
      );
      return false;
    }
    return true;
  }

  private readonly tabIds = new IdCounter();
  private readonly initialTabName = this.tabIds.nextId().toString();
  private openDocs = new rx.State<{ id: string, doc: WournalDocument }[]>([
    {
      id: this.initialTabName,
      doc: WournalDocument.create(this.getContext.bind(this))
    },
    {
      id: this.tabIds.nextId().toString(),
      doc: WournalDocument.create(this.getContext.bind(this))
    },
  ]);
  private activeTabId =
    new rx.State<string>(this.initialTabName, 'Wournal:activeTabId');

  private openTabs: rx.DerivedState<TabDef[]> =
    this.openDocs.derive(docs => docs.map(doc => ({
      id: doc.id.toString(),
      title: tabTitle(doc.doc, doc.id),
      template: DocumentDisplay.t({
        props: {
          doc: new rx.State(doc.doc), // HACK: fixed in mvui 0.0.4
          hideSearchBox: rx.bind(this.hideSearchBox),
          hideSideBar: rx.bind(this.hideSideBar),
        }
      })
    })));

  private tabbarRef = this.ref<TabBar>();
  private get currDocDisplay() {
    return this.tabbarRef.current.activeTabContent as DocumentDisplay;
  }

  private currDoc = this.provideContext(DocumentCtx, this.activeTabId.derive(
    at => this.openDocs.value.find(d => d.id === at).doc
  ));

  private settingsOpen = new rx.State(false, 'Wournal:settingsOpen');

  private dialog = this.provideContext(BasicDialogManagerContext);

  private setupShortcuts() {
    const globalCmds = this.#globalCmds;
    for (const cmd in globalCmds) {
      const k = cmd as keyof typeof globalCmds;
      if (!globalCmds[k].shortcut) continue;
      this.shortcutsCtx.addShortcut(Shortcut.fromId(
        globalCmds[k].shortcut, globalCmds[k].func
      ));
    }

    const extras: { [shortcut: string]: () => any } = {
      'Ctrl+Tab': globalCmds['tab_next'].func,
      'Ctrl+Shift+Tab': globalCmds['tab_prev'].func,
    };

    for (const extra in extras)
      this.shortcutsCtx.addShortcut(Shortcut.fromId(extra, extras[extra]));

    let currentScrollZoom = 0;
    const maybeScrollZoom = debounce((pos: {x: number, y: number}) => {
      this.currDoc.value.setZoom(
        Math.max(0.1, this.api.getZoom() + currentScrollZoom * 0.1),
        pos
      );
      currentScrollZoom = 0;
    }, 150);
    this.subscribe(
      rx.fromEvent(document.body, 'wheel'),
      we => {
        if (!we.ctrlKey) return;
        currentScrollZoom += we.deltaY > 0 ? -1 : 1;
        maybeScrollZoom(we);
      }
    )

    this.onRendered(async () => {
      this.shortcutsCtx.addEl(await this.query('#toolbar'));
      // this.shortcutsCtx.addEl(await this.query('#document-wrapper'));
    });
  }

  private flushLastPages () {
    LastPages.read();
    let fileName: string | false = false;

    const firstPageWithPDF =
      this.currDoc.value.pages.value.find(p => p.pdfMode !== undefined);
    if (firstPageWithPDF !== undefined)
      fileName = firstPageWithPDF.pdfMode.fileName;

    const docId = this.api.getDocumentId();
    if (docId !== false) fileName = docId;

    if (fileName !== false) LastPages.set(fileName, this.api.getCurrentPageNr());
    LastPages.write();
  }

  render() {

    this.setAttribute('data-ui5-compact-size', 'true');

    this.subscribe(this.configCtx, v => this.confRepo.save(v));
    this.subscribe(
      rx.interval(30 * 1000).pipe(rx.startWith(0)),
      _ => this.flushLastPages()
    );

    this.onRendered(() => {
      const stopAutoSave = setupAutosave(
        this.configCtx.value.autosave, () => this.currDoc.value,
        msg => this.dialog.infoBox('Autosave Error', [
          h.p([
            `Something went wrong with the autosave system.`,
            `Please check file permissions on the autosave directory`,
            `(${AUTOSAVE_DIR}). If the error persists, you can disable`,
            `the autosave system in the settings panel.`,
          ]),
          h.p(['The error message was: ', msg]),
        ], 'Warning'),
      );
      this.onRemoved(stopAutoSave);
    })

    this.setupShortcuts();

    this.subscribe(this.configCtx.partial('invertDocument'), i => {
      darkTheme.invert = i ? 'invert(1)' : '';
      const cfgTheme = this.configCtx.value.theme;
      // re-apply a possible change to invert
      if (cfgTheme.startsWith('dark')) style.setTheme('wournal', darkTheme);
      if (
        style.currentTheme.value === 'dark'
        && (cfgTheme.startsWith('auto') || cfgTheme.startsWith('dark'))
      ) style.setTheme('wournal', darkTheme);
    });

    this.subscribe(this.configCtx.partial('theme'), t => {
      if (t.startsWith('light')) style.setTheme('wournal', lightTheme);
      if (t.startsWith('dark')) style.setTheme('wournal', darkTheme);
      const currLight = style.currentTheme.value === 'light';
      ui5.config.setTheme(({
        'auto': currLight ? 'sap_horizon' : 'sap_horizon_dark',
        'light': 'sap_horizon',
        'dark': 'sap_horizon_dark',
        'auto_high_contrast': currLight ? 'sap_horizon_hcw' : 'sap_horizon_hcb',
        'light_high_contrast': 'sap_horizon_hcw',
        'dark_high_contrast': 'sap_horizon_hcb',
      })[t] as any);
      style.setTheme('wournal', ({
        'auto': currLight ? lightTheme : darkTheme,
        'light': lightTheme,
        'dark': darkTheme,
        'auto_high_contrast': currLight ? lightTheme : darkTheme,
        'light_high_contrast': lightTheme,
        'dark_high_contrast': darkTheme,
      })[t] as any)
    })

    this.subscribe(style.currentTheme, theme => {
      if (this.configCtx.value.theme === 'auto') {
        ui5.config.setTheme(theme === 'light' ? 'sap_horizon' : 'sap_horizon_dark');
        style.setTheme('wournal', theme === 'light' ? lightTheme : darkTheme);
      }
      if (this.configCtx.value.theme === 'auto_high_contrast') {
        ui5.config.setTheme(theme === 'light' ? 'sap_horizon_hcw' : 'sap_horizon_hcb');
        style.setTheme('wournal', theme === 'light' ? lightTheme : darkTheme);
      }
    });

    this.subscribe(this.currDoc, doc => {
      updateTitle(doc, this.activeTabId.value);
      this.hideSideBar.next(doc.meta.value.outline.length === 0);
    });
    this.subscribe(
      this.currDoc.pipe(rx.switchMap(doc => doc.undoStack.undoAvailable)),
      _undoavailable => { updateTitle(this.currDoc.value, this.activeTabId.value); }
    );

    // for (let i = 0; i < 100; i++) this.api.createTestPages();
    // this.api.createTestPages();
    this.currDoc.value.undoStack.clear();

    if (this.configCtx.value.checkUpdatesOnStartup && environment.production)
      checkDisplayUpdates(this.dialog.openDialog);

    return [
      h.div(this.dialog.dialogs),
      Settings.t({ props: { open: rx.bind(this.settingsOpen) } }),
      ui5.toast({ fields: { id: 'toast', placement: 'BottomEnd' } }),
      h.div({ fields: { id: 'app' } }, [
        Toolbars.t({
          fields: { id: 'toolbar' },
          props: { doc: this.currDoc },
        }),
        TabBar.t({
          ref: this.tabbarRef,
          props: {
            tabs: this.openTabs,
            activeTab: rx.bind(this.activeTabId),
          },
          // css is weird man. see https://stackoverflow.com/a/50189188
          style: { flexGrow: '1', height: '10%' },
          events: {
            close: ({ detail }) => {
              this.activeTabId.next(detail);
              this.api.closeDocumentPrompt();
            },
            move: ({ detail }) => {
              DSUtils.moveInArr(this.openDocs.value, detail.from, detail.to);
              this.openDocs.next(v => [...v]);
            },
          }
        }),
        StatusBar.t({
          props: { doc: this.currDoc },
        }),
      ]),
    ]
  }


  #logGlobalCmds(cmds: { [key in GlobalCommandIdT]: GlobalCommand }) {
    const keys = Object.keys(cmds) as GlobalCommandIdT[];
    const LOG = getLogger('global-cmds');
    for (const cmd of keys)
      cmds[cmd].func = logFunction(cmds[cmd].func, cmd, LOG.debug);
    return cmds;
  }

  #globalCmds = this.provideContext(GlobalCommandsCtx, this.#logGlobalCmds({
    'file_new': {
      human_name: 'New File',
      func: this.api.newDocument,
      shortcut: 'Ctrl+N',
    },
    'file_save': {
      human_name: 'Save File',
      func: async () => {
        const doc = this.currDoc.value;
        const id = doc.fileName;
        if (id === undefined) {
          return await this.api.saveDocumentPromptMultiPage(doc.defaultFileName('woj'));
        } else {
          this.api.saveDocument(id);
          return id;
        }
      },
      shortcut: 'Ctrl+S',
    },
    'file_save_as': {
      human_name: 'Save As',
      func: () => {
        const doc = this.currDoc.value;
        this.api.saveDocumentPromptMultiPage(
          doc.fileName ?? doc.defaultFileName('woj')
        );
      },
      shortcut: 'Ctrl+Shift+S',
    },
    'file_save_as_single_page': {
      human_name: 'Save as Single SVG',
      func: () => {
        const doc = this.currDoc.value;
        this.api.saveDocumentPromptSinglePage(
          doc.fileName ?? doc.defaultFileName('svg')
        );
      },
      shortcut: 'Ctrl+Shift+Alt+S',
    },
    'file_load': {
      human_name: 'Load File',
      func: this.api.loadDocumentPrompt,
      shortcut: 'Ctrl+O',
    },
    'file_close': {
      human_name: 'Close File',
      func: this.api.closeDocumentPrompt,
      shortcut: 'Ctrl+W',
    },
    'file_export_pdf': {
      human_name: 'Export as PDF',
      func: this.api.promptExportPDF,
      shortcut: 'Ctrl+E',
    },

    'history_undo': {
      human_name: 'Undo',
      func: this.api.undo,
      shortcut: 'Ctrl+Z',
    },
    'history_redo': {
      human_name: 'Redo',
      func: this.api.redo,
      shortcut: 'Ctrl+Y',
    },

    'clipboard_paste': {
      human_name: 'Paste Clipboard/Selection',
      func: this.api.pasteClipboard,
      shortcut: 'Ctrl+V',
    },
    'selection_copy': {
      human_name: 'Copy Selection',
      func: this.api.copySelection,
      shortcut: 'Ctrl+C',
    },
    'selection_cut': {
      human_name: 'Cut Selection',
      func: this.api.cutSelection,
      shortcut: 'Ctrl+X',
    },
    'selection_delete': {
      human_name: 'Delete Selection',
      func: this.api.deleteSelection,
      shortcut: 'Delete',
    },

    'page_set_style': {
      human_name: 'Set Page Style',
      func: async () => {
        this.api.setPagePropsPrompt();
      },
      shortcut: 'Ctrl+Shift+P'
    },
    'page_new_after': {
      human_name: 'New Page After',
      func: () => {
        const nr = this.api.getCurrentPageNr();
        if (this.currDoc.value.pages.value[nr - 1].pdfMode) {
          this.api.addPage(nr, {
            ...this.api.getPageProps(nr),
            backgroundStyle: 'graph',
            pdfMode: undefined,
          })
        } else {
          this.api.addPage(nr, this.api.getPageProps(nr));
        }
        this.api.scrollPage(nr + 1);
      },
      shortcut: 'Ctrl+Shift+ArrowDown'
    },
    'page_delete': {
      human_name: 'Delete Page',
      func: () => {
        if (this.api.getPageCount() <= 1) return;
        this.api.deletePage(this.api.getCurrentPageNr());
      },
      shortcut: 'Ctrl+K',
    },
    'page_move_down': {
      human_name: 'Move Page Down',
      func: () => { this.api.movePage(this.api.getCurrentPageNr(), 'down') },
      shortcut: 'Ctrl+Shift+ArrowRight'
    },
    'page_move_up': {
      human_name: 'Move Page Up',
      func: () => { this.api.movePage(this.api.getCurrentPageNr(), 'up') },
      shortcut: 'Ctrl+Shift+ArrowLeft'
    },

    'preferences_open': {
      human_name: 'Open Preferences',
      func: () => this.settingsOpen.next(true),
      shortcut: 'Ctrl+,'
    },

    'toggle_dark_mode_temp': {
      human_name: 'Temporarily Toggle Dark Mode',
      func: () => {
        const currLight = style.getTheme('wournal') === lightTheme;
        const isHC = this.configCtx.value.theme.includes('high_contrast');
        if (currLight) {
          if (isHC) ui5.config.setTheme('sap_horizon_hcb');
          else ui5.config.setTheme('sap_horizon_dark');
          style.setTheme('wournal', darkTheme);
        } else {
          if (isHC) ui5.config.setTheme('sap_horizon_hcw');
          else ui5.config.setTheme('sap_horizon');
          style.setTheme('wournal', lightTheme);
        }
      },
      shortcut: 'Ctrl+I',
    },

    'zoom_in': {
      human_name: 'Zoom In',
      func: () => this.api.setZoom(this.api.getZoom() + 0.1),
      shortcut: 'Ctrl++'
    },
    'zoom_reset': {
      human_name: 'Zoom Reset',
      func: () => this.api.setZoom(1),
      shortcut: 'Ctrl+0'
    },
    'zoom_out': {
      human_name: 'Zoom Out',
      func: () => this.api.setZoom(this.api.getZoom() - 0.1),
      shortcut: 'Ctrl+-'
    },
    'zoom_fit_width': {
      human_name: 'Zoom to Fit Page Width',
      func: () => this.api.setZoomFitWidth(),
      shortcut: 'Ctrl+1'
    },

    'fullscreen_toggle': {
      human_name: 'Toggle Fullscreen',
      func: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      },
      shortcut: 'F11',
    },

    'tool_pen': {
      human_name: 'Pen',
      func: () => this.api.setTool('CanvasToolPen'),
      shortcut: 'W',
    },
    'tool_highlighter': {
      human_name: 'Highlighter',
      func: () => this.api.setTool('CanvasToolHighlighter'),
      shortcut: 'A',
    },
    'tool_default_pen': {
      human_name: 'Default Pen',
      func: () => {
        this.api.setTool('CanvasToolPen');
        this.currDoc.value.toolConfig.next(v => ({
          ...v,
          CanvasToolPen: this.configCtx.value.tools.CanvasToolPen,
        }));
      },
    },
    'tool_current_default': {
      human_name: 'Reset Tool to Default',
      func: () => {
        const curr = this.api.getTool();
        if (
          curr == 'CanvasToolSelectRectangle' ||
          curr == 'CanvasToolHand' ||
          curr == 'CanvasToolImage' ||
          curr == 'CanvasToolSelectText'
        ) return;
        this.currDoc.value.toolConfig.next(v => {
          const ret = DSUtils.copyObj(v);
          ret[curr] = this.configCtx.value.tools[curr] as any;
          return ret;
        });
      },
    },
    'tool_eraser': {
      human_name: 'Eraser',
      func: () => this.api.setTool('CanvasToolEraser'),
      shortcut: 'E',
    },
    'tool_rectangle': {
      human_name: 'Rectangle',
      func: () => this.api.setTool('CanvasToolRectangle'),
      shortcut: 'Shift+R',
    },
    'tool_ruler': {
      human_name: 'Ruler',
      func: () => this.api.setTool('CanvasToolRuler'),
      shortcut: 'R',
    },
    'tool_ellipse': {
      human_name: 'Ellipse',
      func: () => this.api.setTool('CanvasToolEllipse'),
      shortcut: 'Shift+E',
    },
    'tool_select_rectangle': {
      human_name: 'Select Rectangle',
      func: () => this.api.setTool('CanvasToolSelectRectangle'),
      shortcut: 'S',
    },
    'tool_select_text': {
      human_name: 'Select Text in PDF',
      func: () => this.api.setTool('CanvasToolSelectText'),
      shortcut: 'X',
    },
    'tool_text': {
      human_name: 'Text',
      func: () => this.api.setTool('CanvasToolText'),
      shortcut: 'T',
    },
    'tool_hand': {
      human_name: 'Hand',
      func: (() => {
        let previousTool = this.api.getTool()

        return () => {
          const current = this.api.getTool()
          if (current === 'CanvasToolHand') {
            this.api.setTool(previousTool);
          } else {
            previousTool = current;
            this.api.setTool('CanvasToolHand');
          }
        }
      })(),
      shortcut: 'Q',
    },
    'tool_stroke_width_fine': {
      human_name: 'Set Stroke Width: Fine',
      func: () => this.api.setStrokeWidth('fine'),
    },
    'tool_stroke_width_medium': {
      human_name: 'Set Stroke Width: Medium',
      func: () => this.api.setStrokeWidth('medium'),
    },
    'tool_stroke_width_thick': {
      human_name: 'Set Stroke Width: Thick',
      func: () => this.api.setStrokeWidth('thick'),
    },

    'scroll_page_next': {
      human_name: 'Scroll to Next Page',
      func: () => this.api.scrollPage(this.api.getCurrentPageNr() + 1),
      shortcut: 'Ctrl+ArrowRight',
    },
    'scroll_page_previous': {
      human_name: 'Scroll to Previous Page',
      func: () => this.api.scrollPage(this.api.getCurrentPageNr() - 1),
      shortcut: 'Ctrl+ArrowLeft',
    },
    'scroll_page_focus_goto': {
      human_name: 'Go to Page',
      func: async () => (await this.query<StatusBar>(StatusBar.tagName)).focusGotoPage(),
      shortcut: 'Ctrl+G',
    },
    'scroll_page_last': {
      human_name: 'Scroll to Last Page',
      func: () => {
        this.api.jumplistMark();
        this.api.scrollPage(this.api.getPageCount());
      },
      shortcut: 'End',
    },
    'scroll_page_first': {
      human_name: 'Scroll to First Page',
      func: () => {
        this.api.jumplistMark();
        this.api.scrollPage(1);
      },
      shortcut: 'Home',
    },

    'help_website': {
      human_name: 'Website',
      func: () => window.open('https://github.com/dominiksta/wournal/'),
      shortcut: 'F1',
    },
    'help_about': {
      human_name: 'About',
      func: () => this.dialog.infoBox(
        'About',
        About.t(),
      ),
      shortcut: 'Ctrl+F1',
    },

    'bookmark_add': {
      human_name: 'Add Bookmark',
      func: () => {
        this.hideSideBar.next(false);
        this.currDocDisplay.outline.add();
      },
      shortcut: 'Ctrl+B',
    },

    'bookmark_display_toggle': {
      human_name: 'Toggle Display Bookmarks',
      func: async () => {
        this.hideSideBar.next(v => !v);
      },
      shortcut: 'F12',
    },

    'search_box_show': {
      human_name: 'Search Document',
      func: () => this.hideSearchBox.next(false),
      shortcut: 'Ctrl+F',
    },
    'search_box_hide': {
      human_name: 'Stop Searching Document',
      func: () => this.hideSearchBox.next(true),
    },

    'jumplist_prev': {
      human_name: 'Jump to Previous Marked Position',
      func: () => this.api.jumplistPrev(),
      shortcut: 'Alt+LeftArrow',
    },
    'jumplist_next': {
      human_name: 'Jump to Next Marked Position',
      func: () => this.api.jumplistNext(),
      shortcut: 'Alt+RightArrow',
    },
    'jumplist_mark': {
      human_name: 'Mark Current Position',
      func: () => {
        this.toast.open('Current Position Marked');
        this.api.jumplistMark();
      },
      shortcut: 'Alt+DownArrow',
    },

    'tab_next': {
      human_name: 'Next Tab',
      func: () => {
        const ods = this.openDocs.value;
        const idx = ods.findIndex(od => od.id === this.activeTabId.value);
        if (idx === ods.length - 1 || ods.length <= 1) return;
        this.activeTabId.next(ods[idx+1].id);
      },
      shortcut: 'Ctrl+PageDown',
    },
    'tab_prev': {
      human_name: 'Previous Tab',
      func: () => {
        const ods = this.openDocs.value;
        const idx = ods.findIndex(od => od.id === this.activeTabId.value);
        if (idx === 0 || ods.length <= 1) return;
        this.activeTabId.next(ods[idx-1].id);
      },
      shortcut: 'Ctrl+PageUp',
    },

    'system_show_debug_info': {
      human_name: 'System Debug Information',
      func: () => openSystemDebugInfo(this.dialog.openDialog),
    },

    'system_update': {
      human_name: 'Check for Updates',
      func: async () => {
        const closePleaseWait = this.dialog.pleaseWait('Fetching Updates');
        const releases = await getGithubReleases();
        closePleaseWait();
        if (releases === false) {
          this.dialog.infoBox(
            'Error',
            'Could not fetch updates. Perhaps there is no internet connection?',
            'Error',
          )
        } else {
          if (compareVersionStrings(PackageJson.version, releases[0].ver) >= 0) {
            this.dialog.infoBox('Information', 'No updates available');
          } else {
            checkDisplayUpdates(this.dialog.openDialog, releases, true);
          }
        }
      }
    }
  }));

  static styles = style.sheet({
    ':host': {
      background: ui5.Theme.BackgroundColor,
      display: 'block',
      height: '100%',
    },
    '#app': {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
  });

}

function updateTitle(doc: WournalDocument, tabId: string) {
  ApiClient['window:setTitle'](
    'Wournal - ' + (doc.dirty ? '*' : '') + tabTitle(doc, tabId)
  );
}

function tabTitle(doc: WournalDocument, tabId: string) {
  let fileName: string | false = false;

  const firstPageWithPDF = doc.pages.value.find(p => p.pdfMode !== undefined);
  if (firstPageWithPDF !== undefined) fileName = firstPageWithPDF.pdfMode.fileName;

  const docId = doc.fileName;
  if (docId !== undefined) fileName = docId;

  return fileName !== false
    ? FileUtils.fileNameNoPath(fileName) : `Unsaved ${tabId}`;
}

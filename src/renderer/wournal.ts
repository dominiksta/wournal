import { Component, h, rx, style } from '@mvui/core';
import './global-styles';
import './app/debugger';
import * as ui5 from "@mvui/ui5";
import Toolbars from 'app/toolbars';
import { darkTheme, lightTheme, theme } from "./global-styles";
import { WournalDocument } from "document/WournalDocument";
import { ConfigRepositoryLocalStorage } from 'persistence/ConfigRepositoryLocalStorage';
import { WournalPageSize } from 'document/WournalPageSize';
import { ConfigCtx } from 'app/config-context';
import { Settings } from 'app/settings';
import { ToastCtx } from 'app/toast-context';
import { Shortcut, ShortcutManager } from 'app/shortcuts';
import { ShortcutsCtx } from 'app/shortcuts-context';
import { WournalApi } from 'api';
import { ApiCtx } from 'app/api-context';
import { GlobalCommandsCtx } from 'app/global-commands';
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
import { ConfigDTOVersioner } from 'persistence/ConfigDTO';

@Component.register
export default class Wournal extends Component {

  private fileSystem = inject('FileSystem');
  private confRepo = ConfigRepositoryLocalStorage.getInstance();

  private configCtx = this.provideContext(
    ConfigCtx, new rx.State(ConfigDTOVersioner.updateToCurrent(this.confRepo.load()))
  );
  private shortcutsCtx = this.provideContext(ShortcutsCtx, new ShortcutManager());

  private toast = this.provideContext(ToastCtx, {
    open: async (msg: string) => {
      const toast = await this.query<ui5.types.Toast>('#toast');
      toast.innerText = msg;
      toast.show();
    }
  });

  public api: WournalApi = this.provideContext(ApiCtx, {
    // document
    // ----------------------------------------------------------------------
    saveDocumentPromptSinglePage: async (defaultIdentification) => {
      const doc = this.doc.value
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
    saveDocumentPromptMultiPage: async (defaultIdentification) => {
      const resp = await this.fileSystem.savePrompt(defaultIdentification, [
        { extensions: ['woj'], name: 'Wournal File (Multi-Page) (.woj)' },
        { extensions: ['*'], name: 'All Files' },
      ]);
      if (!resp) return false;
      await this.api.saveDocument(resp);
      return resp;
    },
    saveDocument: async (identification) => {
      const doc = this.doc.value;
      await this.fileSystem.write(identification, await doc.toFile());
      doc.fileName = identification;
      doc.markSaved();
      updateTitle(doc);
      this.toast.open('Document Saved');
    },
    loadDocumentPrompt: async () => {
      if (await this.api.promptClosingUnsaved()) return;
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
    loadDocument: async (fileName) => {
      this.doc.next(WournalDocument.create(this.getContext.bind(this)));
      const closePleaseWait = this.dialog.pleaseWait(
        'Loading Document',
      );
      await new Promise(resolve => setTimeout(resolve, 100));

      if (this.configCtx.value.autoOpenWojWithSameNameAsPDF) {
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
      if (!blob) return false;
      let pdfNotFoundActions: {
        fileName: string, replaceOrRemove: string | false
      }[] = [];
      let doc = await WournalDocument.fromFile(
        this.getContext.bind(this), fileName, blob, pdfNotFoundActions
      );
      while (doc instanceof FileNotFoundError) {
        const file = doc.fileName;
        const resp = await new Promise<string | false>(resolve => this.dialog.openDialog(_close => ({
          heading: 'PDF Not Found!',
          state: 'Error',
          content: h.section([
            `The PDF file "${file}" was not found. ` +
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
        })));
        pdfNotFoundActions.push({ fileName: doc.fileName, replaceOrRemove: resp  });
        console.log(pdfNotFoundActions);
        doc = await WournalDocument.fromFile(
          this.getContext.bind(this), fileName, blob, pdfNotFoundActions
        );
      }
      if (doc.isSinglePage) this.toast.open(
        'This is a single page document (SVG). You will not be able to add ' +
        'pages unless you save as a .woj file'
      )
      await this.doc.value.free();
      this.doc.next(doc);
      closePleaseWait();
      this.shortcutsCtx.focus();
      return true;
    },
    newDocument: async (props, identification) => {
      if (await this.api.promptClosingUnsaved()) return;
      const doc = WournalDocument.create(this.getContext.bind(this), props);
      await this.doc.value.free();
      this.doc.next(doc);
      if (identification) {
        doc.fileName = identification;
        updateTitle(doc);
        doc.isSinglePage = identification.endsWith('.svg');
        console.log(identification, doc.isSinglePage);
      }
    },
    createTestPages: () => {
      this.doc.value.addNewPage({
        width: WournalPageSize.DINA4.height,
        height: WournalPageSize.DINA4.width,
        backgroundColor: '#FFFFFF',
        backgroundStyle: 'ruled',
      });
      this.doc.value.addNewPage({
        ...WournalPageSize.DINA5, backgroundColor: '#FFFFFF',
        backgroundStyle: 'blank'
      });
      this.doc.value.addNewPage({
        ...WournalPageSize.DINA5, backgroundColor: '#FFFFFF',
        backgroundStyle: 'graph'
      });
    },
    promptClosingUnsaved: async () => {
      const doc = this.doc.value;
      if (!doc.dirty) return false;
      return new Promise(resolve => {
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

    // history
    // ----------------------------------------------------------------------
    undo: () => { this.doc.value.undo() },
    redo: () => { this.doc.value.redo() },

    // clipboard/selection
    // ----------------------------------------------------------------------
    pasteClipboard: () => { this.doc.value.pasteClipboard() },
    cutSelection: () => { this.doc.value.selectionCut() },
    copySelection: () => { this.doc.value.selectionCopy() },
    deleteSelection: () => { this.doc.value.selectionCut(true) },

    // zoom
    // ----------------------------------------------------------------------
    setZoom: (zoom) => { this.doc.value.setZoom(zoom) },
    getZoom: () => { return this.doc.value.getZoom(); },
    setZoomFitWidth: () => {
      const idx = this.api.getCurrentPageNr();
      this.doc.value.setZoomFitWidth();
      this.doc.value.setActivePageForCurrentScroll();
      if (idx !== this.api.getCurrentPageNr()) this.api.scrollPage(idx);
    },

    // tools
    // ----------------------------------------------------------------------
    setTool: (tool: CanvasToolName) => {
      this.doc.value.setTool(CanvasToolFactory.forName(tool));
    },
    getTool: () => {
      return this.doc.value.currentTool.value.name;
    },
    setStrokeWidth: (width) => { this.doc.value.setStrokeWidth(width) },
    setColorByName: (name: string) => {
      this.doc.value.setColor(
        this.configCtx.value.colorPalette.find(c => c.name === name).color
      );
    },
    setColorByHex: (color: string) => {
      this.doc.value.setColor(color);
    },
    setFont: (opt) => {
      const newCfg = DSUtils.copyObj(this.doc.value.toolConfig.value);
      newCfg.CanvasToolText.fontFamily = opt.family;
      newCfg.CanvasToolText.fontSize = opt.size;
      newCfg.CanvasToolText.fontStyle = opt.style;
      newCfg.CanvasToolText.fontWeight = opt.weight;
      this.doc.value.toolConfig.next(newCfg);
    },
    getFont: () => {
      const cfg = this.doc.value.toolConfig.value.CanvasToolText;
      return {
        family: cfg.fontFamily,
        size: cfg.fontSize,
        style: cfg.fontStyle,
        weight: cfg.fontWeight,
      }
    },

    // scroll
    // ----------------------------------------------------------------------
    scrollPage: page => {
      page -= 1;
      const doc = this.doc.value; const pages = doc.pages.value;
      if (page < 0 || page >= pages.length) return;
      doc.activePage.next(pages[page]);
      doc.activePage.value.display.scrollIntoView();
    },
    scrollPos: (top, left) => {
      this.documentRef.current.scrollTop = top;
      this.documentRef.current.scrollLeft = left;
    },
    getScrollPos: () => {
      return {
        top: this.documentRef.current.scrollTop,
        left: this.documentRef.current.scrollLeft,
      }
    },

    // layers
    // ----------------------------------------------------------------------
    newLayer: (name) => {
      this.doc.value.activePage.value.addLayer(name);
    },
    setActiveLayer: (name) => {
      this.doc.value.activePage.value.setActivePaintLayer(name);
    },
    getLayerStatus: () => {
      return this.doc.value.activePage.value.layers.value;
    },
    setLayerVisible: (name, visible) => {
      return this.doc.value.activePage.value.setLayerVisible(name, visible);
    },
    deleteLayer: (name) => {
      return this.doc.value.activePage.value.deleteLayer(name);
    },
    moveLayer: (name, direction) => {
      return this.doc.value.activePage.value.moveLayer(name, direction);
    },
    renameLayer: (name, newName) => {
      this.doc.value.activePage.value.renameLayer(name, newName);
    },

    // page manipulation
    // ----------------------------------------------------------------------
    getCurrentPageNr: () => {
      return this.doc.value.pages.value.indexOf(this.doc.value.activePage.value) + 1;
    },
    getPageCount: () => {
      return this.doc.value.pages.value.length;
    },
    setPageProps: props => {
      this.doc.value.activePage.value.setPageProps(props);
    },
    setPagePropsPrompt: async () => {
      const page = this.doc.value.activePage.value;
      const resp = await pageStyleDialog(
        this.dialog.openDialog, DSUtils.copyObj(page.getPageProps())
      );
      if (resp) this.api.setPageProps(resp);
    },
    addPage: (addAfterPageNr, props) => {
      if (!this.checkSinglePage()) return;
      this.doc.value.addNewPage(props, addAfterPageNr);
    },
    deletePage: pageNr => {
      if (!this.checkSinglePage()) return;
      this.doc.value.deletePage(pageNr);
    },
    getPageProps: pageNr => {
      const page = this.doc.value.pages.value[pageNr - 1];
      return page.getPageProps();
    },
    movePage: (pageNr, direction) => {
      if (!this.checkSinglePage()) return;
      this.doc.value.movePage(pageNr, direction);
    },
  })

  private checkSinglePage() {
    if (this.doc.value.isSinglePage) {
      this.dialog.infoBox(
        'Warning',
        'Operation Disabled in Single Page Documents',
        'Warning',
      );
      return false;
    }
    return true;
  }

  private doc = new rx.State(WournalDocument.create(this.getContext.bind(this)));

  private settingsOpen = new rx.State(false);

  private dialog = this.provideContext(BasicDialogManagerContext);

  private documentRef = this.ref<HTMLDivElement>();

  render() {
    this.setAttribute('data-ui5-compact-size', 'true');

    this.subscribe(this.configCtx, v => this.confRepo.save(v));

    const globalCmds = this.#globalCmds;
    for (const cmd in globalCmds) {
      const k = cmd as keyof typeof globalCmds;
      if (!globalCmds[k].shortcut) continue;
      this.shortcutsCtx.addShortcut(Shortcut.fromId(
        globalCmds[k].shortcut, globalCmds[k].func
      ));
    }

    this.onRendered(async () => {
      this.shortcutsCtx.addEl(await this.query('#toolbar'));
      this.shortcutsCtx.addEl(await this.query('#document'));
    });

    this.subscribe(this.configCtx.partial('invertDocument'), i => {
      darkTheme.invert = i ? 'invert(1)' : '';
      const cfgTheme = this.configCtx.value.theme;
      // re-apply a possible change to invert
      if (cfgTheme.startsWith('dark')) style.setTheme('wournal', darkTheme);
      if (
        style.currentTheme$.value === 'dark'
        && (cfgTheme.startsWith('auto') || cfgTheme.startsWith('dark'))
      ) style.setTheme('wournal', darkTheme);
    });

    this.subscribe(this.configCtx.partial('theme'), t => {
      if (t.startsWith('light')) style.setTheme('wournal', lightTheme);
      if (t.startsWith('dark')) style.setTheme('wournal', darkTheme);
      const currLight = style.currentTheme$.value === 'light';
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

    this.subscribe(style.currentTheme$, theme => {
      if (this.configCtx.value.theme === 'auto') {
        ui5.config.setTheme(theme === 'light' ? 'sap_horizon' : 'sap_horizon_dark');
        style.setTheme('wournal', theme === 'light' ? lightTheme : darkTheme);
      }
      if (this.configCtx.value.theme === 'auto_high_contrast') {
        ui5.config.setTheme(theme === 'light' ? 'sap_horizon_hcw' : 'sap_horizon_hcb');
        style.setTheme('wournal', theme === 'light' ? lightTheme : darkTheme);
      }
    });

    this.subscribe(this.doc, doc => { updateTitle(doc); });
    this.subscribe(
      this.doc.pipe(rx.switchMap(doc => doc.undoStack.undoAvailable)),
      _undoavailable => { updateTitle(this.doc.value); }
    );

    // for (let i = 0; i < 100; i++) this.api.createTestPages();
    this.api.createTestPages();
    this.doc.value.undoStack.clear();

    return [
      Toolbars.t({
        fields: { id: 'toolbar' },
        props: { doc: this.doc },
      }),
      StatusBar.t({
        props: { doc: this.doc },
      }),
      h.div(this.shortcutsCtx),
      h.div(this.dialog.dialogs),
      Settings.t({ props: { open: rx.bind(this.settingsOpen) } }),
      ui5.toast({ fields: { id: 'toast', placement: 'BottomEnd' } }),
      h.div({
        ref: this.documentRef,
        fields: { id: 'document' },
        events: {
          scroll: () => {
            this.doc.value.setActivePageForCurrentScroll();
          }
        }
      }, this.doc),
    ]
  }

  #globalCmds = this.provideContext(GlobalCommandsCtx, {
    'file_new': {
      human_name: 'New File',
      func: this.api.newDocument,
      shortcut: 'Ctrl+N',
    },
    'file_save': {
      human_name: 'Save File',
      func: async () => {
        const doc = this.doc.value;
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
        const doc = this.doc.value;
        this.api.saveDocumentPromptMultiPage(
          doc.fileName ?? doc.defaultFileName('woj')
        );
      },
      shortcut: 'Ctrl+Shift+S',
    },
    'file_save_as_single_page': {
      human_name: 'Save As Single SVG',
      func: () => {
        const doc = this.doc.value;
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
        if (this.doc.value.pages.value[nr - 1].pdfMode) {
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
        this.doc.value.toolConfig.next(v => ({
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
          curr == 'CanvasToolImage'
        ) return;
        this.doc.value.toolConfig.next(v => {
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
      func: () => this.api.scrollPage(this.api.getPageCount()),
      shortcut: 'End',
    },
    'scroll_page_first': {
      human_name: 'Scroll to First Page',
      func: () => this.api.scrollPage(1),
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
    },
  });

  static styles = style.sheet({
    ':host': {
      background: ui5.Theme.BackgroundColor,
      display: 'block',
      height: '100%',
    },
    '#document': {
      position: 'relative',
      top: '87px',
      marginBottom: '100px',
      background: theme.documentBackground,
      height: 'calc(100% - 87px - 35px)',
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

function updateTitle(doc: WournalDocument) {
  const dirty = doc.dirty ? '*' : '';
  ApiClient['window:setTitle'](
    doc.fileName
      ? 'Wournal - ' + dirty + FileUtils.fileNameNoPath(doc.fileName)
      : 'Wournal'
  );
}

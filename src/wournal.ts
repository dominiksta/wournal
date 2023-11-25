import { Component, h, rx, style } from '@mvui/core';
import './global-styles';
import './app/debugger';
import * as ui5 from "@mvui/ui5";
import Toolbars from 'app/toolbars';
import { darkTheme, lightTheme, theme } from "./global-styles";
import { WournalDocument } from "document/WournalDocument";
import { ConfigRepositoryLocalStorage } from 'persistence/ConfigRepositoryLocalStorage';
import { DocumentRepositoryBrowserFiles } from 'persistence/DocumentRepositoryBrowserFiles';
import { WournalPageSize } from 'document/WournalPageSize';
import { ConfigCtx } from 'app/config-context';
import { Settings } from 'app/settings';
import { ToastCtx } from 'app/toast-context';
import { Shortcut, ShortcutManager } from 'app/shortcuts';
import { ShortcutsCtx } from 'app/shortcuts-context';
import { CanvasToolStrokeWidth } from 'persistence/ConfigDTO';
import { WournalApi } from 'api';
import { ApiCtx } from 'app/api-context';
import { GlobalCommandsCtx } from 'app/global-commands';
import { CanvasToolName } from 'document/CanvasTool';
import { CanvasToolFactory } from 'document/CanvasToolFactory';
import { StatusBar } from 'app/status-bar';
import { BasicDialogManagerContext } from 'common/dialog-manager';
import { DSUtils } from 'util/DSUtils';
import { pageStyleDialog } from 'app/page-style-dialog';

@Component.register
export default class Wournal extends Component {

  private docRepo = DocumentRepositoryBrowserFiles.getInstance();
  private confRepo = ConfigRepositoryLocalStorage.getInstance();

  private configCtx = this.provideContext(
    ConfigCtx, new rx.State(this.confRepo.load())
  );
  private shortcutsCtx = this.provideContext(ShortcutsCtx, new ShortcutManager());
  private doc = new rx.State(WournalDocument.create(
    this.configCtx, this.shortcutsCtx)
  );

  private settingsOpen = new rx.State(false);

  private dialog = this.provideContext(BasicDialogManagerContext);


  render() {
    this.setAttribute('data-ui5-compact-size', 'true');

    const toast = this.provideContext(ToastCtx, {
      open: async (msg: string) => {
        const toast = await this.query<ui5.types.Toast>('#toast');
        toast.innerText = msg;
        toast.show();
      }
    }).open;

    this.provideContext(ApiCtx, this.api);

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

    this.subscribe(style.currentTheme$, theme => {
      ui5.config.setTheme(theme === 'light' ? 'sap_horizon' : 'sap_horizon_dark');
      style.setTheme('wournal', theme === 'light' ? lightTheme : darkTheme);
    });

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
        fields: { id: 'document' },
        events: {
          scroll: () => {
            this.doc.value.setActivePageForCurrentScroll();
          }
        }
      }, this.doc),
    ]
  }

  api: WournalApi = {
    // document
    // ----------------------------------------------------------------------
    saveDocumentPrompt: () => {
      this.docRepo.save(this.doc.value.toDto());
    },
    loadDocumentPrompt: async () => {
      this.doc.next(
        WournalDocument.fromDto(
          this.configCtx, this.shortcutsCtx, await this.docRepo.load(""),
        )
      )
    },
    newDocument: () => {
      this.doc.next(WournalDocument.create(this.configCtx, this.shortcutsCtx));
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

    // history
    // ----------------------------------------------------------------------
    undo: () => { this.doc.value.undo() },
    redo: () => { this.doc.value.redo() },

    // clipboard/selection
    // ----------------------------------------------------------------------
    pasteClipboardOrSelection: () => { this.doc.value.selectionOrClipboardPaste() },
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
      const resp = await pageStyleDialog(this.dialog.openDialog, {
        width: page.width,
        height: page.height,
        backgroundColor: page.backgroundColor,
        backgroundStyle: page.backgroundStyle,
      });
      if (resp) this.api.setPageProps(resp);
    },
    addPage: (addAfterPageNr, props) => {
      this.doc.value.addNewPage(props, addAfterPageNr);
    },
    deletePage: pageNr => {
      this.doc.value.deletePage(pageNr);
    },
    getPageProps: pageNr => {
      const page = this.doc.value.pages.value[pageNr - 1];
      return page.getPageProps();
    },
    movePage: (pageNr, direction) => {
      this.doc.value.movePage(pageNr, direction);
    },
  }


  #globalCmds = this.provideContext(GlobalCommandsCtx, {
    'file_new': {
      human_name: 'New File',
      func: this.api.newDocument,
      shortcut: 'Ctrl+N',
    },
    'file_save': {
      human_name: 'Save File',
      func: this.api.saveDocumentPrompt,
      shortcut: 'Ctrl+S',
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

    'selection_or_clipboard_paste': {
      human_name: 'Paste Clipboard/Selection',
      func: this.api.pasteClipboardOrSelection,
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
        this.api.addPage(nr, this.api.getPageProps(nr));
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
    'tool_eraser': {
      human_name: 'Eraser',
      func: () => this.api.setTool('CanvasToolEraser'),
      shortcut: 'E',
    },
    'tool_rectangle': {
      human_name: 'Rectangle',
      func: () => this.api.setTool('CanvasToolRectangle'),
      shortcut: 'R',
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
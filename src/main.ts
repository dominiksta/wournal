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

@Component.register
class App extends Component {

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

  render() {
    this.setAttribute('data-ui5-compact-size', 'true');

    this.provideContext(ToastCtx, {
      open: async (msg: string) => {
        const toast = await this.query<ui5.types.Toast>('#toast');
        console.log(toast);
        toast.innerText = msg;
        toast.show();
      }
    });

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

    // this.document.createTestPages();

    return [
      Toolbars.t({
        fields: { id: 'toolbar' },
        props: { doc: this.doc },
      }),
      h.div(this.shortcutsCtx),
      Settings.t({ props: { open: rx.bind(this.settingsOpen) } }),
      ui5.toast({ fields: { id: 'toast', placement: 'BottomEnd' }}),
      h.div({ fields: { id: 'document' }}, this.doc),
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
      this.doc.value.addNewPage(WournalPageSize.DINA4_LANDSCAPE);
      this.doc.value.addNewPage(WournalPageSize.DINA5_PORTRAIT);
      this.doc.value.addNewPage(WournalPageSize.DINA5_LANDSCAPE);
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
  });

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
      zIndex: '2',
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

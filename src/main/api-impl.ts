import { BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron';
import type { ElectronApi, ApiSpec, ApiRouteName } from './api';
import fs from 'fs';

type ApiImpl<T extends ApiSpec<ApiRouteName>> = {
  [K in ApiRouteName]: (e: IpcMainInvokeEvent, ...args: Parameters<T[K]>) => ReturnType<T[K]>
}

export function registerApiHandlers(win: BrowserWindow) {

  const impl: ApiImpl<ElectronApi> = {
    'debug:echo': async (_, msg) => {
      return msg;
    },
    'debug:showDevTools': async () => {
      win.webContents.openDevTools();
    },
    'debug:binTest': async () => {
      return new Uint8Array([1, 2, 3]);
    },

    'file:load': async (_, path) => {
      console.log(`Loading file: ${path}`);
      return fs.readFileSync(path, { encoding: null }).buffer;
    },
    'file:loadPrompt': async () => {
      const ret = dialog.showOpenDialogSync(win, {
        filters: [
          { extensions: ['woj'], name: 'Wournal Files (.woj)' },
          { extensions: ['svg'], name: 'SVG Files (.svg)' },
        ],
        properties: ['openFile'],
      });
      if (!ret) return;
      const path = ret[0];
      console.log(`Loading file: ${path}`);
      return {
        buf: fs.readFileSync(path, { encoding: null }).buffer,
        path
      };
    },
    'file:save': async (_, path, data) => {
      console.log(`Writing file: ${path}`);
      fs.writeFileSync(path, new DataView(data), { encoding: null });
    },
    'file:savePrompt': async (_, data, defaultPath) => {
      const resp = dialog.showSaveDialogSync(win, {
        filters: [
          { extensions: ['woj'], name: 'Wournal Files (.woj)' },
          { extensions: ['svg'], name: 'SVG Files (.svg)' },
        ],
        properties: ['showOverwriteConfirmation'],
        defaultPath
      });
      if (!resp) return false;
      console.log(`Writing file: ${resp}`);
      fs.writeFileSync(resp, new DataView(data), { encoding: null });
      return true;
    },

    'process:argv': async () => { return process.argv; }
  }

  for (let key in impl) {
    ipcMain.handle(key, impl[key as keyof typeof impl])
  }
}

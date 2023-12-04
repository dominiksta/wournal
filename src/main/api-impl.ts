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

    'file:read': async (_, path) => {
      console.log(`Loading file: ${path}`);
      return fs.readFileSync(path, { encoding: null }).buffer;
    },
    'file:loadPrompt': async (_, filters) => {
      const ret = dialog.showOpenDialogSync(win, {
        filters, properties: ['openFile'],
      });
      if (!ret) return false;
      return ret[0];
    },
    'file:write': async (_, path, data) => {
      console.log(`Writing file: ${path}`);
      fs.writeFileSync(path, new DataView(data), { encoding: null });
    },
    'file:savePrompt': async (_, defaultPath, filters) => {
      const resp = dialog.showSaveDialogSync(win, {
        filters, properties: ['showOverwriteConfirmation'], defaultPath
      });
      if (!resp) return false;
      return resp;
    },

    'process:argv': async () => {
      if (process.argv.length > 3) return [];
      return process.argv;
    },

    'window:setTitle': async (_, title) => {
      win.setTitle(title);
    }
  }

  for (let key in impl) {
    ipcMain.handle(key, impl[key as keyof typeof impl])
  }
}

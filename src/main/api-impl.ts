import {
  BrowserWindow, clipboard,
  dialog, ipcMain, IpcMainInvokeEvent, nativeImage
} from 'electron';
import type { ElectronApi, ApiSpec, ApiRouteName, ElectronCallbacks } from './api';
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
      console.log('Opening Devtools');
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
    },

    'window:destroy': async (_) => { win.destroy(); },

    'clipboard:writeWournal': async (_, d) => clipboard.writeBuffer(
      'image/wournal', Buffer.from(JSON.stringify(d), 'utf-8')
    ),
    'clipboard:readText': async (_) => clipboard.readText(),
    'clipboard:readImage': async (_) => {
      const img = clipboard.readImage();
      if (img.toBitmap().length === 0) return false;
      else return img.toDataURL();
    },
    'clipboard:readWournal': async (_) => {
      const resp = clipboard.readBuffer('image/wournal');
      if (resp.length === 0) return false;
      else return JSON.parse(resp.toString('utf-8'));
    },
  }

  for (let key in impl) {
    ipcMain.handle(key, impl[key as keyof typeof impl])
  }
}

type CallbackImpl = {
  [key in keyof ElectronCallbacks]:
    (send: (args: ElectronCallbacks[key]) => void) => void
};

export function registerCallbacks(win: BrowserWindow) {
  const impl: CallbackImpl = {

    'window:close': send => win.on('close', event => {
      if (process.env.NODE_ENV !== 'development') event.preventDefault();
      else send({})
    }),

  }

  for (let key in impl) (impl as any)[key](
    (...args: any[]) => {
      console.log(`Callback Triggered: ${key}`);
      win.webContents.send(key, ...args);
    }
  )
}

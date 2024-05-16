import {
    app,
  BrowserWindow, clipboard, dialog, ipcMain, IpcMainInvokeEvent, shell
} from 'electron';
import type { ElectronApi, ApiSpec, ApiRouteName, ElectronCallbacks } from './api';
import fs from 'fs';
import { instances } from './main';
import { parseArgs } from 'node:util';
import { argvParseSpec } from './argv';
import { homedir } from 'os';
import { normalize } from 'path';

type ApiImpl<T extends ApiSpec<ApiRouteName>> = {
  [K in ApiRouteName]: (e: IpcMainInvokeEvent, ...args: Parameters<T[K]>) => ReturnType<T[K]>
}

export function registerApiHandlers() {

  const impl: ApiImpl<ElectronApi> = {
    'debug:echo': async (_, msg) => {
      return msg;
    },
    'debug:showDevTools': async (e) => {
      console.log('Opening Devtools');
      instances.get(e.sender)!.win.webContents.openDevTools();
    },
    'debug:binTest': async () => {
      return new Uint8Array([1, 2, 3]);
    },

    'shell:open': async (_, path) => {
      path = normalize(path.replace(/^~/, homedir));
      shell.openPath(path);
    },
    'shell:addRecentDocument': async (_, path) => {
      app.addRecentDocument(path);
    },

    'file:read': async (_, path) => {
      path = path.replace(/^~/, homedir);
      console.log(`Loading file: ${path}`);
      if (!fs.existsSync(path)) return false;
      const b = fs.readFileSync(path, { encoding: null });
      // Jesus chist node. This is why nobody likes javascript.
      //
      // A node `Buffer` has a `buffer` property, which exposes the an
      // `ArrayBuffer`. Since only `ArrayBuffer` is supported in frontend js,
      // one would assume that we could just send `buffer` over the wire here
      // and be done. However, multiple node `Buffer`s may share a single
      // `ArrayBuffer` under the hood as a performance optimization. Because of
      // this, we have to explicitly get the desired part of the `ArrayBuffer`
      // we want like this.
      //
      // This was a fun one to debug. Getting random garbled data, but only
      // sometimes and only in prod. Great.
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    },
    'file:loadPrompt': async (e, filters) => {
      const win = instances.get(e.sender)!.win;
      const ret = dialog.showOpenDialogSync(win, {
        filters, properties: ['openFile'],
      });
      if (!ret) return false;
      return ret[0];
    },
    'file:write': async (_, path, data) => {
      path = path.replace(/^~/, homedir);
      console.log(`Writing file: ${path}`);
      fs.writeFileSync(path, new DataView(data), { encoding: null });
    },
    'file:savePrompt': async (e, defaultPath, filters) => {
      const win = instances.get(e.sender)!.win;
      const resp = dialog.showSaveDialogSync(win, {
        filters, properties: ['showOverwriteConfirmation'], defaultPath
      });
      if (!resp) return false;
      return resp;
    },
    'file:exists': async (_, fileName) => {
      fileName = fileName.replace(/^~/, homedir);
      return fs.existsSync(fileName);
    },
    'file:mkdir': async (_, path) => {
      path = path.replace(/^~/, homedir);
      fs.mkdirSync(path, { recursive: true });
    },
    'file:ls': async (_, dirName) => {
      dirName = dirName.replace(/^~/, homedir);
      return fs.readdirSync(dirName);
    },
    'file:rm': async (_, fileName) => {
      const allowedDir = process.platform === 'win32'
        ? '~/AppData/Local/Wournal'
        : '~/.cache/wournal/';
      if (!fileName.startsWith(allowedDir))
        throw new Error(`Cannot rm in dir: ${fileName}`);
      fileName = fileName.replace(/^~/, homedir);
      return fs.rmSync(fileName);
    },

    'process:argv': async (e) => {
      const argv = instances.get(e.sender)!.argv;
      return parseArgs({ args: argv, ...argvParseSpec});
    },

    'window:setTitle': async (e, title) => {
      instances.get(e.sender)!.win.setTitle(title);
    },
    'window:destroy': async (e) => { instances.get(e.sender)!.win.destroy(); },
    'window:setZoom': async (e, zoom) => {
      instances.get(e.sender)!.win.webContents.setZoomFactor(zoom);
    },

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
      send({})
    }),

  }

  for (let key in impl) (impl as any)[key](
    (...args: any[]) => {
      console.log(`Callback Triggered: ${key}`);
      win.webContents.send(key, ...args);
    }
  )
}

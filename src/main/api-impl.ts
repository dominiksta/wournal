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
import path from 'path';
import { APP_CACHE_DIR, getAppDir } from 'Shared/const';
import { getLogger } from 'Shared/logging';

const LOG = getLogger(__filename);

type ApiImpl<T extends ApiSpec<ApiRouteName>> = {
  [K in ApiRouteName]: (e: IpcMainInvokeEvent, ...args: Parameters<T[K]>) => ReturnType<T[K]>
}

export function registerApiHandlers() {

  const impl: ApiImpl<ElectronApi> = {
    'debug:echo': async (_, msg) => {
      return msg;
    },
    'debug:showDevTools': async (e) => {
      LOG.info('Opening Devtools');
      instances.get(e.sender)!.win.webContents.openDevTools();
    },
    'debug:binTest': async () => {
      return new Uint8Array([1, 2, 3]);
    },

    'shell:open': async (_, filePath) => {
      filePath = path.normalize(filePath.replace(/^~/, homedir));
      shell.openPath(filePath);
    },
    'shell:addRecentDocument': async (_, filePath) => {
      app.addRecentDocument(filePath);
    },

    'file:read': async (_, filePath) => {
      filePath = filePath.replace(/^~/, homedir);
      LOG.info(`Loading file: ${filePath}`);
      if (!fs.existsSync(filePath)) return false;
      const b = fs.readFileSync(filePath, { encoding: null });
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
    'file:write': async (_, filePath, data) => {
      filePath = filePath.replace(/^~/, homedir);
      LOG.info(`Writing file: ${filePath}`);
      fs.writeFileSync(filePath, new DataView(data), { encoding: null });
    },
    'file:savePrompt': async (e, defaultPath, filters) => {
      const win = instances.get(e.sender)!.win;
      const resp = await dialog.showSaveDialog(win, {
        filters, properties: ['showOverwriteConfirmation'], defaultPath
      });
      if (resp.canceled) return false;
      return resp.filePath;
    },
    'file:exists': async (_, fileName) => {
      fileName = fileName.replace(/^~/, homedir);
      return fs.existsSync(fileName);
    },
    'file:mkdir': async (_, filePath) => {
      filePath = filePath.replace(/^~/, homedir);
      fs.mkdirSync(filePath, { recursive: true });
    },
    'file:ls': async (_, dirName) => {
      dirName = dirName.replace(/^~/, homedir);
      return fs.readdirSync(dirName);
    },
    'file:rm': async (_, fileName) => {
      if (!fileName.startsWith(`${APP_CACHE_DIR}/`))
        throw new Error(
          `Cannot rm in dir: ${fileName}, allowed is ${APP_CACHE_DIR}`
        );
      fileName = fileName.replace(/^~/, homedir);
      return fs.rmSync(fileName);
    },

    'process:argv': async (e) => {
      const argv = instances.get(e.sender)!.argv;
      return parseArgs({ args: argv, ...argvParseSpec});
    },
    'process:getRendererSourceDir': async () => {
      // @ts-ignore
      let entry: string = MAIN_WINDOW_WEBPACK_ENTRY;

      entry = entry.endsWith('index.html')
        ? entry.split('index.html')[0]
        : entry;

      if (entry.endsWith('/') || entry.endsWith('\\'))
        entry = entry.slice(0, entry.length - 1);

      return entry;
    },
    'process:getAppDir': async () => getAppDir(),
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
      LOG.info(`Callback Triggered: ${key}`);
      win.webContents.send(key, ...args);
    }
  )
}

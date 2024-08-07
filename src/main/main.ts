import { registerApiHandlers, registerCallbacks } from './api-impl';
import { app, BrowserWindow, shell, WebContents } from 'electron';
import path from 'node:path';
import environment from 'Shared/environment';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// We disable security warnings because we have to use unsafe-eval for ajv
// schema compilation. This should not cause an issue since we are still (a) not
// exposing node directly and (b) sanitizing all loaded svg with dompurify.
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

if (environment.pkgPortable) app.setPath(
  'userData',
  path.resolve(path.dirname(app.getAppPath()), '..', 'user', 'data')
);

export const instances: Map<WebContents, {
  win: BrowserWindow, pwd: string, argv: string[]
}> = new Map();

function createWindow(argv: string[], pwd: string) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  })
  win.setMenu(null);

  if (!app.isPackaged) win.webContents.openDevTools();
  if (process.argv.indexOf('--dev-tools') !== -1)
    win.webContents.openDevTools();

  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  win.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  try {
    registerCallbacks(win);
  } catch {
    win.webContents.openDevTools();
  }

  instances.set(win.webContents, { win, argv, pwd });
  win.show();
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  registerApiHandlers();
  app.whenReady().then(() => createWindow(process.argv, process.cwd()));
  app.on('second-instance', (_, argv, pwd) => createWindow(argv, pwd));
  app.on('window-all-closed', () => app.quit());
}

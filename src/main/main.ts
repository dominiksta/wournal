import { registerApiHandlers, registerCallbacks } from './api-impl';
import { app, BrowserWindow, shell, WebContents } from 'electron';
import path from 'path';
import { URL } from 'url';

// We disable security warnings because we have to use unsafe-eval for ajv
// schema compilation. This should not cause an issue since we are still (a) not
// exposing node directly and (b) sanitizing all loaded svg with dompurify.
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 8080;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const instances: Map<WebContents, {
  win: BrowserWindow, pwd: string, argv: string[]
}> = new Map();

function createWindow(argv: string[], pwd: string) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../dist/dev-preload/preload.js'),
    },
  })
  win.setMenu(null);

  if (!app.isPackaged) win.webContents.openDevTools();
  if (process.argv.indexOf('--dev-tools') !== -1)
    win.webContents.openDevTools();

  win.loadURL(resolveHtmlPath('index.html'))

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

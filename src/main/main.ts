import { registerApiHandlers } from './api-impl';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { URL } from 'url';

function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 8080;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

app.whenReady().then(() => {
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

  try {
    registerApiHandlers(win);
    win.loadURL(resolveHtmlPath('index.html'))
  } catch {
    win.webContents.openDevTools();
  }
})

app.on('window-all-closed', () => { app.quit() })

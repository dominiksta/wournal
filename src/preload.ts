// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ElectronCallbackNames } from './main/api';
import { contextBridge, ipcRenderer } from 'electron';

const callbacks = {} as any;
for (let key of ElectronCallbackNames) {
  callbacks[key] = (callback: Function) =>
    ipcRenderer.on(key, (_event, ...args) => callback(args));
}

contextBridge.exposeInMainWorld('electron', {
  invoke: ipcRenderer.invoke,
  on: callbacks,
})
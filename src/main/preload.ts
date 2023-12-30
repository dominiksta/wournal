import { ElectronCallbackNames } from './api';
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

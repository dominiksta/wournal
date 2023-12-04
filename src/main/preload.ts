import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronInvoke', ipcRenderer.invoke)

import environment from "./environment";
import { HOST_OS, runningInElectronMain, runningInElectronRenderer } from "./util";

export const APP_CACHE_DIR = HOST_OS === 'windows'
  ? '~/AppData/Roaming/Wournal/'
  : '~/.cache/Wournal/'

export const AUTOSAVE_DIR = APP_CACHE_DIR + 'autosave/';

export async function getAppDir(): Promise<string> {
  if (runningInElectronRenderer()) {
    return window.electron.invoke('process:getAppDir');
  } else if (runningInElectronMain()) {
    const path = await import('path');
    const electron = await import('electron');
    return path.normalize(
      path.resolve(path.dirname(electron.app.getAppPath()), '..', 'user')
    );
  } else {
    throw new Error('not running in electron');
  }
}

export async function getConfigFileDir(): Promise<string> {
  return environment.pkgPortable
    ? (await getAppDir()).replaceAll('\\', '/')
    : (
      HOST_OS === 'windows'
        ? '~/AppData/Roaming/Wournal/config'
        : '~/.config/Wournal/config'
    )
}

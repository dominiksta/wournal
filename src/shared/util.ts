export const runningInElectronRenderer = () => (
  typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
);

export const runningInElectronMain = () => (
  typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!process.versions.electron
);

type HostOS = 'windows' | 'gnu_linux';

function getHostOS(): HostOS {
  if (runningInElectronRenderer()) {
    return navigator.userAgent.indexOf('Windows') === -1 ?
      'gnu_linux' : 'windows';
  } else if (runningInElectronMain()) {
    return process.platform === 'win32' ? 'windows' : 'gnu_linux';
  } else {
    throw new Error('not running in electron');
  }
}

export const HOST_OS: HostOS = getHostOS();

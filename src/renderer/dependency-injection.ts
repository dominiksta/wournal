import FileSystem from "persistence/FileSystem";
import SystemClipboard from "util/SystemClipboard";
import { ConfigRepositoryLocalStorage } from 'persistence/ConfigRepositoryLocalStorage';

type Dependencies = {
  'FileSystem': FileSystem,
  'SystemClipboard': SystemClipboard,
  'ConfigRepository': ConfigRepositoryLocalStorage,
  'sourceLocation': string,
};

export function provideDependencies(providers: Dependencies): void {
  (window as any).__WOURNAL_DEPENDENCIES = providers;
}

export function inject<T extends keyof Dependencies>(token: T): Dependencies[T] {
  if (!('__WOURNAL_DEPENDENCIES' in window))
    throw new Error('Dependency Injection not configured')
  return (window as any).__WOURNAL_DEPENDENCIES[token];
}

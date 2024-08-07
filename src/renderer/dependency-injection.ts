import FileSystem from "persistence/FileSystem";
import SystemClipboard from "util/SystemClipboard";
import { ConfigRepository } from "persistence/ConfigRepository";

type Dependencies = {
  'FileSystem': FileSystem,
  'SystemClipboard': SystemClipboard,
  'ConfigRepository': ConfigRepository,
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

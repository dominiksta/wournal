import { ConfigDTO, defaultConfig } from "./ConfigDTO";
import { ConfigRepository } from "./ConfigRepository";

const CONFIG_LOCALSTORAGE_KEY = "wournal_config";

export class ConfigRepositoryLocalStorage extends ConfigRepository {

  private constructor() { super(); }
  private static instance: ConfigRepositoryLocalStorage;
  public static getInstance(): ConfigRepositoryLocalStorage {
    if (ConfigRepositoryLocalStorage.instance == null)
      ConfigRepositoryLocalStorage.instance = new ConfigRepositoryLocalStorage();
    return ConfigRepositoryLocalStorage.instance;
  }

  public async load(): Promise<ConfigDTO> {
    // HACK: In the future, this should be verified using something
    // like json or xml schema
    const inStorage = localStorage.getItem(CONFIG_LOCALSTORAGE_KEY);
    return (inStorage !== null) ? JSON.parse(inStorage) : defaultConfig();
  }

  public async save(dto: ConfigDTO) {
    localStorage.setItem(CONFIG_LOCALSTORAGE_KEY, JSON.stringify(dto));
  }
}

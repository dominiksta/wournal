import { ConfigDTO, ConfigDTOVersioner, defaultConfig } from "./ConfigDTO";
import { ConfigRepository } from "./ConfigRepository";

export const CONFIG_LOCALSTORAGE_KEY = "wournal_config";

export class ConfigRepositoryLocalStorage implements ConfigRepository {

  private constructor() { }
  private static instance: ConfigRepositoryLocalStorage;
  public static getInstance(): ConfigRepositoryLocalStorage {
    if (ConfigRepositoryLocalStorage.instance == null)
      ConfigRepositoryLocalStorage.instance = new ConfigRepositoryLocalStorage();
    return ConfigRepositoryLocalStorage.instance;
  }

  public async load(): Promise<ConfigDTO> {
    const inStorage = localStorage.getItem(CONFIG_LOCALSTORAGE_KEY);
    return (inStorage !== null)
      ? ConfigDTOVersioner.updateToCurrent(JSON.parse(inStorage))
      : defaultConfig();
  }

  public async save(dto: ConfigDTO) {
    ConfigDTOVersioner.validate(dto);
    localStorage.setItem(CONFIG_LOCALSTORAGE_KEY, JSON.stringify(dto));
  }
}

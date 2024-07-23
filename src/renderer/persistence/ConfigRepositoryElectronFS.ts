import { ApiClient } from "electron-api-client";
import environment from "Shared/environment";
import { getLogger } from "util/Logging";
import { ConfigDTO, ConfigDTOVersioner, defaultConfig } from "./ConfigDTO";
import { ConfigRepository } from "./ConfigRepository";
import { ConfigRepositoryLocalStorage, CONFIG_LOCALSTORAGE_KEY } from "./ConfigRepositoryLocalStorage";
import FileSystemElectron from "./FileSystemElectron";

const LOG = getLogger(__filename);
const fs = FileSystemElectron;

const getConfigFileDir = async () => (
  environment.pkgPortable
    ? (await ApiClient["process:getAppDir"]()).replaceAll('\\', '/')
    : (
      navigator.userAgent.includes('Windows')
        ? '~/AppData/Roaming/Wournal/config'
        : '~/.config/Wournal/config'
    )
);

const CONFIG_FILE_NAME = 'config.json';

export const mkConfigRepositoryElectronFS: () => Promise<ConfigRepository> =
  async () => {
    const dir = await getConfigFileDir();
    const path = `${dir}/${CONFIG_FILE_NAME}`;

    async function save(dto: ConfigDTO) {
      LOG.info(`Writing config to ${path}...`);
      ConfigDTOVersioner.validate(dto);
      await fs.mkdir(dir);
      await fs.write(path, new Blob([JSON.stringify(dto, null, 2)]));
      LOG.info(`Wrote config to ${path}`);
    }

    async function load(): Promise<ConfigDTO> {
      if (localStorage.getItem(CONFIG_LOCALSTORAGE_KEY) !== null) {
        LOG.info('Migrating old localStorage config to file...');
        const inLocalStorage =
          await ConfigRepositoryLocalStorage.getInstance().load();
        await save(inLocalStorage);
        localStorage.removeItem(CONFIG_LOCALSTORAGE_KEY);
      }

      LOG.info(`Getting config from disk ${path}...`);
      await fs.mkdir(dir);
      const exists = await fs.exists(path);
      if (!exists) {
        LOG.info(`Config not found in ${path}, using default`);
        return defaultConfig();
      }
      const blob = await fs.read(path);
      if (!blob) throw new Error(`Error reading config file (${path})`);
      const text = await blob.text();
      const parsed = ConfigDTOVersioner.updateToCurrent(JSON.parse(text));
      LOG.info(`Got config from disk ${path}`);
      return parsed
    }

    return { load, save };
  }

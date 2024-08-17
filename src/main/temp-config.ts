import DTOVersioner from "Shared/dto-versioner";
import Ajv, { JTDDataType } from 'ajv/dist/jtd';
import fs from 'fs';
import { APP_CACHE_DIR } from "Shared/const";
import { getLogger } from "Shared/logging";
import { homedir } from 'os';

const LOG = getLogger(__filename);
const ajv = new Ajv();

const TempConfigSchema = {
  properties: {
    version: { type: 'float32' },
    windowHeight: { type: 'int32' },
    windowWidth: { type: 'int32' },
    maximized: { type: 'boolean' },
  },
} as const;
export type TempConfig = JTDDataType<typeof TempConfigSchema>;

export const TempConfigVersioner = new DTOVersioner<TempConfig>({
  name: 'TempConfig',
  validator: ((() => {
    const validate = ajv.compile(TempConfigSchema);
    return obj => {
      const res = validate(obj);
      return { success: res, error: JSON.stringify(validate.errors) };
    }
  }))(),
  getVersion: obj => obj.version,
  updateFunctions: {

  }
});

const TEMP_CONFIG_FILE =
  `${APP_CACHE_DIR}/tmp-config.json`.replace(/^~/, homedir);

export const TEMP_CONFIG_CURRENT_VERSION = TempConfigVersioner.maxVersion();

const defaultTempConfig = (): TempConfig => ({
  version: TEMP_CONFIG_CURRENT_VERSION,
  windowHeight: 600,
  windowWidth: 800,
  maximized: false,
});

export function getTempConfig(): TempConfig {
  try {
    if (!fs.existsSync(TEMP_CONFIG_FILE)) {
      LOG.info('Was not created yet, using default');
      return defaultTempConfig();
    }
    const file = fs.readFileSync(TEMP_CONFIG_FILE, { encoding: 'utf-8' });
    const ret = TempConfigVersioner.updateToCurrent(JSON.parse(file));
    LOG.info('Found and parsed, using existing', ret);
    return ret;
  } catch (e) {
    LOG.warn('Could not read, using default', e);
    return defaultTempConfig();
  }
}

export function writeTempConfig(cfg: TempConfig): void {
  TempConfigVersioner.validate(cfg);
  fs.writeFileSync(
    TEMP_CONFIG_FILE, JSON.stringify(cfg, null, 2),
    { encoding: 'utf-8' }
  );
  LOG.info('Wrote', cfg);
}

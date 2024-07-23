import { inject } from "dependency-injection";
import { AutosaveConfig } from "persistence/ConfigDTO";
import { FileUtils } from "util/FileUtils";
import { getLogger } from "util/Logging";
import { WournalDocument } from "./WournalDocument";

const LOG = getLogger(__filename);

export const AUTOSAVE_DIR = navigator.userAgent.indexOf('Windows') !== -1
  ? '~/AppData/Roaming/Wournal/autosave/'
  : '~/.cache/Wournal/autosave/';

export default function setupAutosave(
  cfg: AutosaveConfig,
  currentDoc: () => WournalDocument,
): () => void {
  const fs = inject('FileSystem');
  LOG.info(
    `Autosave initialized with ${cfg.intervalSeconds}s interval`
  );

  // format example: 2024-01-24_23-41-12_filename.ext
  const parseDate = (fileName: string): { fileName: string, date: Date | false } => {
    const re = /^\d\d\d\d-\d\d-\d\d_\d\d-\d\d-\d\d_/;
    if (!re.test(fileName)) {
      LOG.warn(`Could not parse autosave filename: ${fileName}`);
      return { fileName, date: false };
    }
    const date = new Date(Date.parse(fileName.slice(0, 10)));
    const hms = fileName.slice(10, 19).split('-').map(parseInt);
    date.setHours(hms[0], hms[1], hms[2]);
    return { fileName, date };
  };

  const autosaveFileName = (doc: WournalDocument): string => {
    const now = new Date();
    const extension = doc.isSinglePage ? 'svg' : 'woj';
    const pad = (s: number) => s.toString().padStart(2, '0');

    const fileNameDate = (
      `${now.getFullYear()}` +
      `-${pad(now.getMonth() + 1)}` +
      `-${pad(now.getDate())}` +
      '_' +
      `${pad(now.getHours())}` +
      `-${pad(now.getMinutes())}` +
      `-${pad(now.getSeconds())}`
    );

    const fileNameCurrent = doc.fileName
      ? FileUtils.fileNameNoPath(doc.fileName)
      : 'unsaved';
    return `${fileNameDate}_${fileNameCurrent}.${extension}`;
  }

  const interval = setInterval(async () => {
    LOG.info('Checking Autosave...');

    const doc = currentDoc();
    if (!doc.dirty) {
      LOG.info('Autosave skipped because document is not dirty');
      return;
    }

    try {
      await fs.mkdir(AUTOSAVE_DIR);
      const existing = await fs.ls(AUTOSAVE_DIR);
      if (existing.length > cfg.keepFiles) {
        // smaller (-> older) first
        LOG.info(existing);
        const sorted = existing
          .map(parseDate)
          .filter(el => el.date !== false)
          .sort() as { fileName: string, date: Date }[];
        if (sorted.length <= cfg.keepFiles) {
          LOG.info('No autosave files found to delete')
          return;
        }
        for (const f of sorted.slice(0, sorted.length - cfg.keepFiles)) {
          LOG.info(`Deleting autosave ${f.fileName}`)
          await fs.rm(AUTOSAVE_DIR + f.fileName);
        }
      }
    } catch(e) {
      LOG.warn(`Could not delete autosaves`, e);
    }

    const now = new Date();
    now.getFullYear()
    const fileName = autosaveFileName(doc);
    LOG.info(`Saving autosave ${fileName}`);
    fs.write(AUTOSAVE_DIR + fileName, await doc.toFile());

  }, cfg.intervalSeconds * 1000) as any as number;

  return () => {
    LOG.warn('Disabling autosave');
    clearInterval(interval);
  };
}

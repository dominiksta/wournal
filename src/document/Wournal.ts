import { rx } from "@mvui/core";
import { CanvasToolConfig, ConfigDTO } from "../persistence/ConfigDTO";
import { ConfigRepository } from "../persistence/ConfigRepository";
import { ConfigRepositoryLocalStorage } from "../persistence/ConfigRepositoryLocalStorage";
import { DocumentRepository } from "../persistence/DocumentRepository";
import { DocumentRepositoryBrowserFiles } from "../persistence/DocumentRepositoryBrowserFiles";
import { DocumentService } from "../persistence/DocumentService";
import { ClipboardUtils } from "../util/ClipboardUtils";
import { DSUtils } from "../util/DSUtils";
import { WournalDocument } from "./WournalDocument";
import { WournalPageSize } from "./WournalPageSize";

export class Wournal {
  public doc = new rx.State<WournalDocument | undefined>(undefined);
  get display() { return this._display; }

  private docRepo: DocumentRepository;
  private confRepo: ConfigRepository;
  /** Config as loaded from a ConfigRepository */
  public static CONF: ConfigDTO;
  /** Current tool state/config. Should not be saved to main Config unless
  requested explicitly by the user. */
  public static currToolConf: CanvasToolConfig;


  constructor(
    private _display: HTMLDivElement,
    // this could be something like "electron" or "android" in the future
    private env: "browser",
  ) {
    switch (env) {
      case "browser":
        this.docRepo = DocumentRepositoryBrowserFiles.getInstance();
        this.confRepo = ConfigRepositoryLocalStorage.getInstance();
        break;
      default:
        throw new Error(`Trying to init invalid env: ${env}`)
    };
  }

  public async init() {
    await this.loadConfig();
    await this.loadDocument(true);
    this.createTestPages();
  }

  public async loadConfig(): Promise<ConfigDTO> {
    Wournal.CONF = await this.confRepo.load();
    Wournal.currToolConf = DSUtils.copyObj(Wournal.CONF.tools);
    return Wournal.CONF;
  }
  public async saveConfig(dto: ConfigDTO) {
    await this.confRepo.save(dto);
  }

  public async loadDocument(empty: boolean = false) {
    let disp = this.newDisplayEl();
    this.doc.next(
      empty
        ? WournalDocument.create(disp)
        : await DocumentService.load(disp, this.docRepo, ""))
    ;
    this.clearDisplayEl();
    this._display.appendChild(disp);
  }

  public async saveDocument() {
    DocumentService.save(this.doc.value, this.docRepo);
  }

  private clearDisplayEl() {
    let docEl = this._display.querySelector<HTMLDivElement>("#wournal-document");
    if (docEl) this._display.removeChild(docEl);
  }

  private newDisplayEl(): HTMLDivElement {
    let docEl = this._display.ownerDocument.createElement("div");
    docEl.id = "wournal-document";
    docEl.style.margin = "10px";
    return docEl;
  }

  private createTestPages() {
    this.doc.value.addNewPage(WournalPageSize.DINA4_LANDSCAPE);
    this.doc.value.addNewPage(WournalPageSize.DINA5_PORTRAIT);
    this.doc.value.addNewPage(WournalPageSize.DINA5_LANDSCAPE);
  }
}

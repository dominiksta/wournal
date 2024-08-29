import { BackgroundStyleT } from "document/BackgroundGenerators";
import { CanvasToolName } from "document/CanvasTool";
import { PageProps } from "document/WournalPage";
import { CanvasToolStrokeWidth } from "persistence/ConfigDTO";

export interface WournalApi {

  // document
  // ----------------------------------------------------------------------
  saveDocument(identification: string): Promise<void>;
  saveDocumentPromptSinglePage(
    defaultIdentification?: string
  ): Promise<string | false>;
  saveDocumentPromptMultiPage(
    defaultIdentification?: string
  ): Promise<string | false>;
  loadDocumentPrompt(): Promise<boolean>;
  loadDocument(identification: string): Promise<boolean>;
  newDocument(props?: PageProps, identification?: string): void;
  closeDocumentPrompt(): Promise<boolean>;
  closeDocumentPromptAll(): Promise<boolean>;
  getDocumentId(): string | false;
  createTestPages(): void;
  promptClosingUnsaved(): Promise<boolean>;
  promptExportPDF(): Promise<boolean>;

  // history
  // ----------------------------------------------------------------------
  undo(): void;
  redo(): void;

  // clipboard/selection
  // ----------------------------------------------------------------------
  pasteClipboard(): void;
  cutSelection(): void;
  copySelection(): void;
  deleteSelection(): void;

  // jumplist
  // ----------------------------------------------------------------------
  jumplistPrev(): void;
  jumplistNext(): void;
  jumplistMark(): void;

  // zoom
  // ----------------------------------------------------------------------
  setZoom(zoom: number): void;
  getZoom(): number;
  setZoomFitWidth(): void;

  // tools
  // ----------------------------------------------------------------------
  setTool(name: CanvasToolName): void;
  getTool(): CanvasToolName;
  setStrokeWidth(width: CanvasToolStrokeWidth): void;
  setColorByName(name: string): void;
  setColorByHex(color: string): void;
  setFont(opt: {
    family: string, size: number, weight: 'normal' | 'bold',
    style: 'normal' | 'italic'
  }): void;
  getFont(): {
    family: string, size: number, weight: 'normal' | 'bold',
    style: 'normal' | 'italic'
  };

  // scroll
  // ----------------------------------------------------------------------
  scrollPage(pageNr: number): void;
  scrollPos(top: number, left: number): void;
  getScrollPos(): { top: number, left: number };

  // layers
  // ----------------------------------------------------------------------
  newLayer(name?: string): void;
  setActiveLayer(layer: string): void;
  getLayerStatus(): { name: string, current: boolean, visible: boolean }[];
  setLayerVisible(layer: string, visible: boolean): void;
  deleteLayer(layer: string): void;
  moveLayer(name: string, direction: 'up' | 'down'): void;
  renameLayer(name: string, newName: string): void;

  // page manipulation
  // ----------------------------------------------------------------------
  getCurrentPageNr(): number;
  getPageCount(): number;
  setPageProps(props: PageProps): void;
  setPagePropsPrompt(): void;
  addPage(addAfterPageNr: number, props: PageProps): void;
  getPageProps(pageNr: number): PageProps;
  deletePage(pageNr: number): void;
  movePage(pageNr: number, direction: 'up' | 'down'): void;

}

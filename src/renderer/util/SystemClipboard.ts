import { CanvasElementDTO } from "document/CanvasElement";

export default interface SystemClipboard {

  writeWournal(image: CanvasElementDTO[]): Promise<void>;

  readText(): Promise<string | false>;
  readImage(): Promise<string | false>;
  readWournal(): Promise<CanvasElementDTO[] | false>;

}

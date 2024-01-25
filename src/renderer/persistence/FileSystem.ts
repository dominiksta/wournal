
export default interface FileSystem {

  write(path: string, blob: Blob): Promise<void>;
  read(path: string): Promise<Blob | false>;

  loadPrompt(filters?: {
    extensions: string[],
    name: string,
  }[]): Promise<string | false>;
  savePrompt(
    defaultPath?: string,
    filters?: {
      extensions: string[],
      name: string,
    }[]
  ): Promise<string | false>;

  exists(path: string): Promise<boolean>;

  mkdir(path: string): Promise<void>;
  ls(path: string): Promise<string[]>;
  rm(path: string): Promise<void>;

}


export default interface FileSystem {

  write(path: string, blob: Blob): Promise<void>;
  read(path: string): Promise<Blob>;

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

}

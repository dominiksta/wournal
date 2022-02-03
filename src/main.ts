import { DocumentRepositoryBrowserFiles } from "./persistence/DocumentRepositoryBrowserFiles";
import { DocumentRepositoryTestFiles } from "./persistence/DocumentRepositoryTestFiles";
import { Wournal } from "./ui/Wournal";

let repoImpl = DocumentRepositoryBrowserFiles.getInstance();
// let repoImpl = DocumentRepositoryTestFiles.getInstance();

let wournal = new Wournal(
    document.getElementById("wournal") as HTMLDivElement, repoImpl,
);

(<any>window).wournal = wournal;

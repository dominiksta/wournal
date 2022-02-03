import { FileUtils } from "../util/FileUtils";
import { LOG } from "../util/Logging";
import { DocumentRepository } from "./DocumentRepository";
import { DocumentDTO } from "./DocumentDTO";
import { DocumentRepositoryBrowserFiles } from "./DocumentRepositoryBrowserFiles";

export class DocumentRepositoryTestFiles extends DocumentRepository {

    private static instance: DocumentRepository = null;
    private constructor() { super(); }
    static getInstance(): DocumentRepositoryTestFiles {
        if (this.instance == null)
            this.instance = new DocumentRepositoryTestFiles();
        return this.instance;
    }

    override async load(identification: string): Promise<DocumentDTO> {
        const url = "res/testpage.svg";
        LOG.info(`Loading url: ${url}...`);
        let fetched = await ((await fetch(url)).text());
        return new DocumentDTO(
            "testpage.svg", [
                FileUtils.firstSvgElFromXmlFileString(fetched).outerHTML
            ]
        );;
    }

    /**
     * Download `doc` through the browser as a file. Returns an empty string as
     * identification.
     */
    override async save(doc: DocumentDTO): Promise<void> {
        DocumentRepositoryBrowserFiles.getInstance().save(doc);
    }
}

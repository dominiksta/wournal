import { FileUtils } from "../util/FileUtils";
import { LOG } from "../util/Logging";
import { DocumentRepository } from "./DocumentRepository";
import { DocumentDTO } from "./DocumentDTO";

/**
 * TODO: This currently only implements saving/loading single svg files. In the
 * future, files containing multiple pages ('.woj' maybe?) should be possible;
 */
export class DocumentRepositoryBrowserFiles extends DocumentRepository {

    private static instance: DocumentRepository = null;
    private constructor() { super(); }
    static getInstance(): DocumentRepositoryBrowserFiles {
        if (this.instance == null)
            this.instance = new DocumentRepositoryBrowserFiles();
        return this.instance;
    }

    /**
     * Load the document through a file picker interface from the
     * browser. `identification` will be ignored.
     */
    override async load(identification: string): Promise<DocumentDTO> {
        let file = await FileUtils.promptReadTextFile();
        LOG.info(`Loading file from browser: ${file.name}`);
        return new DocumentDTO(
            file.name, [
                FileUtils.firstSvgElFromXmlFileString(file.content).outerHTML
            ]
        );;
    }

    /**
     * Download `doc` through the browser as a file. Returns an empty string as
     * identification.
     */
    override async save(doc: DocumentDTO): Promise<void> {
        FileUtils.downloadStringAsUtf8File(
            doc.identification,
            FileUtils.addXmlHeaderToSvgString(doc.pagesSvg[0])
        );
    }
}

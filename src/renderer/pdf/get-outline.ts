import { PDFDocumentProxy } from "pdfjs-dist";
import { OutlineNode } from "persistence/DocumentMeta";
import { getLogger } from "util/Logging";

const LOG = getLogger(__filename);

export async function getPDFOutline(doc: PDFDocumentProxy): Promise<OutlineNode[]> {
  const resp = await doc.getOutline();
  if (resp === null || resp.length === 0) return [];

  const format = async (o: typeof resp[0]): Promise<OutlineNode> => {
    let children: OutlineNode[] = [];
    for (const c of o.items) children.push(await format(c));
    const dest = typeof o.dest === 'string' ? await doc.getDestination(o.dest) : o.dest;
    if (dest[0] === null) LOG.warn(`Invalid outline dest: ${o.title}`)
    return {
      title: o.title
        .replaceAll('\n', ' ')
        // yes i actually found a pdf with \r in an outline. may the tool that
        // allowed the creation of that pdf rot in hell
        .replaceAll('\r', ''),
      pageNr: dest[0] !== null ? (await doc.getPageIndex(dest[0]) + 1) : -1,
      expanded: children.length !== 0,
      children,
    }
  }

  let ret: OutlineNode[] = [];
  for (const r of resp) ret.push(await format(r));
  LOG.debug('Got PDF Outline', ret);
  return ret;
}

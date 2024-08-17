import { JTDDataType } from "ajv/dist/core";
import DTOVersioner from "Shared/dto-versioner";
import Ajv from 'ajv/dist/jtd';
import PackageJson from 'PackageJson';

const ajv = new Ajv();

const OutlineNodeSchemaDef = {
  outlineNode: {
    properties: {
      title: { type: 'string' },
      pageNr: { type: 'int32' },
      expanded: { type: 'boolean' },
      children: { elements: { ref: 'outlineNode' } },
    },
  }
} as const;

const OutlineNodeSchema = {
  ref: 'outlineNode',
  definitions: { ...OutlineNodeSchemaDef },
} as const;

export type OutlineNode = JTDDataType<typeof OutlineNodeSchema>;

const DocumentMetaSchema = {
  properties: {
    metaVersion: { type: 'float32' },
    lastSavedTime: { type: 'string' },
    lastSavedWournalVersion: { type: 'string' },
    outline: { elements: { ref: 'outlineNode' } },
  },
  definitions: { ...OutlineNodeSchemaDef }
} as const;

export type DocumentMeta = JTDDataType<typeof DocumentMetaSchema>;

export const DocumentMetaVersioner = new DTOVersioner<DocumentMeta>({
  name: 'DocumentMeta',
  validator: ((() => {
    const validate = ajv.compile(DocumentMetaSchema);
    return obj => {
      const res = validate(obj);
      return { success: res, error: validate.errors?.toString() };
    }
  }))(),
  getVersion: obj => obj.version,
  updateFunctions: {
    // 0.1 init
    // ----------------------------------------------------------------------
    0.1: (none: any) => none,
  }
})

export const DOCUMENT_META_CURRENT_VERSION = DocumentMetaVersioner.maxVersion();

export function defaultDocumentMeta(): DocumentMeta {
  return {
    metaVersion: DOCUMENT_META_CURRENT_VERSION,
    lastSavedTime: new Date().toISOString(),
    lastSavedWournalVersion: PackageJson.version,
    outline: [],
  };
}

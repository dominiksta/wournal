declare class Highlight {
  constructor(...args: Range[]);
  add(r: Range): void;
  clear(): void;
  delete(r: Range): void;
};

const highlights = new Map<string, Highlight>();

export const Highlights = {
  add(range: Range, id: string) {
    if (!highlights.has(id)) {
      highlights.set(id, new Highlight());
      (CSS as any).highlights.set(id, highlights.get(id));
    }
    highlights.get(id).add(range);
  },

  delete(range: Range, id: string) {
    if (!highlights.has(id)) return;
    highlights.get(id).delete(range);
  },

  clear(id: string) {
    if (!highlights.has(id)) return;
    highlights.get(id).clear();
  }
}

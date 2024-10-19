import {
  WOURNAL_SVG_LAYER_CURRENT_ATTR, WOURNAL_SVG_LAYER_NAME_ATTR,
  WOURNAL_SVG_PAGE_BACKGROUND_COLOR_ATTR, WOURNAL_SVG_PAGE_BACKGROUND_STYLE_ATTR,
  WOURNAL_SVG_PAGE_MARKER_ATTR, WOURNAL_SVG_PAGE_PDF_ATTR
} from 'document/WournalPage';
import { sanitize } from 'dompurify';

export const DOMUtils = {
  maybeRemoveChild: function(node: Node, child: Node): void {
    node.childNodes.forEach((c) => {
      if (c === child) node.removeChild(child);
    });
  },

  checkParentClassList: function(e: Element, className: string): boolean {
    if (e.className.split(' ').indexOf(className) >= 0) return true;
    return e.parentElement && DOMUtils.checkParentClassList(e.parentElement, className);
  },

  /** Return an elements attributes as a Map */
  attributesAsObj: function(el: Element): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (let a of el.attributes) result[a.name] = a.value;
    return result;
  },

  /** Return a nodes numerical position as a child of its parent */
  nodeIndexInParent: function(node: Node) {
    // From https://stackoverflow.com/a/4649781
    return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
  },

  insertNodeBeforeIndex: function(node: Node, parent: Node, idx: number) {
    const c = parent.childNodes;
    // LOG.info(idx, c.length, parent.childNodes[idx-1]);
    console.assert(idx >= 0 && idx < c.length + 1, `${idx}, ${c.length}`);
    if (idx === c.length) parent.appendChild(node);
    else if (idx === 0 && parent.firstChild) parent.insertBefore(node, parent.firstChild);
    else c[idx].before(node);
  },

  /**
     This should hopefully prevent most XSS attacks. It's probable not /that/
     important for wournal because I do not expect people to share a lot of
     wournal documents, but if that does happen, this should be a reasonable
     enough protection against basic "script-kiddies".
   */
  sanitizeSVG: function(svg: string): string {
    // return svg;
    return sanitize(svg, {
      USE_PROFILES: { svg: true },
      ADD_ATTR: [
        WOURNAL_SVG_PAGE_MARKER_ATTR,
        WOURNAL_SVG_LAYER_CURRENT_ATTR,
        WOURNAL_SVG_LAYER_NAME_ATTR,
        WOURNAL_SVG_PAGE_BACKGROUND_COLOR_ATTR,
        WOURNAL_SVG_PAGE_BACKGROUND_STYLE_ATTR,
        WOURNAL_SVG_PAGE_PDF_ATTR,
      ],
    });
  },


  /**
   * Get the active element (like document.activeElement, except it "pierces"
   * shadow roots). Thanks to
   * https://www.abeautifulsite.net/posts/finding-the-active-element-in-a-shadow-root/
   */
  getActiveElement: function (root: Document | ShadowRoot = document): Element | null {
    const activeEl = root.activeElement;
    if (!activeEl) return null;
    return (activeEl.shadowRoot)
      ? this.getActiveElement(activeEl.shadowRoot)
      : activeEl;
  },

}

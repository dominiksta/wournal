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

  createElementFromHTML: function <T>(htmlString: string) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes.
    return (div as any).firstChild as T;
  },

  /** Return an elements attributes as a Map */
  attributesAsMap: function(el: Element): Map<string, string> {
    let result = new Map<string, string>();
    for (let a of el.attributes) result.set(a.name, a.value);
    return result;
  },

  /** Return a nodes numerical position as a child of its parent */
  nodeIndexInParent: function(node: Node) {
    // From https://stackoverflow.com/a/4649781
    return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
  },

  insertNodeBeforeIndex: function(node: Node, parent: Node, idx: number) {
    const c = parent.childNodes;
    // console.log(idx, c.length, parent.childNodes[idx-1]);
    console.assert(idx >= 0 && idx < c.length + 1, `${idx}, ${c.length}`);
    if (idx === c.length) parent.appendChild(node);
    else if (idx === 0 && parent.firstChild) parent.insertBefore(node, parent.firstChild);
    else c[idx].before(node);
  }
}

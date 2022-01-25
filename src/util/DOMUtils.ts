export const DOMUtils = {
    maybeRemoveChild: function(node: Node, child: Node): void {
        node.childNodes.forEach((c) => {
            if (c === child) node.removeChild(child);
        });
    }
}

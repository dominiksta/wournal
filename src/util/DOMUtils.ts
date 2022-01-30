export const DOMUtils = {
    maybeRemoveChild: function(node: Node, child: Node): void {
        node.childNodes.forEach((c) => {
            if (c === child) node.removeChild(child);
        });
    },

    createElementFromHTML: function<T>(htmlString: string) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();

        // Change this to div.childNodes to support multiple top-level nodes.
        return <any>div.firstChild as T;
    },
}

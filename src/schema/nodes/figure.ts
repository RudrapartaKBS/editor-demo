import { NodeSpec } from "prosemirror-model";

export const figureNode: NodeSpec = {
  content: "image figcaption?",
  group: "block",
  defining: true,
  atom: true,
  attrs: {
    align: { default: "left" }, // left, center, right
  },
  
  parseDOM: [
    {
      tag: "figure",
      getAttrs(dom) {
        const el = dom as HTMLElement;
        return {
          align: el.getAttribute("data-align") || "left",
        };
      },
    },
  ],
  
  toDOM(node) {
    const { align } = node.attrs;
    return ["figure", { "data-align": align, class: `figure-${align}` }, 0];
  },
};

export const figcaptionNode: NodeSpec = {
  content: "inline*",
  group: "figcaption",
  defining: true,
  
  parseDOM: [{ tag: "figcaption" }],
  toDOM() {
    return ["figcaption", 0];
  },
};
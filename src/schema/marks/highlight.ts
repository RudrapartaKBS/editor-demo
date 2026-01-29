import { MarkSpec } from "prosemirror-model";

export const highlightMark: MarkSpec = {
  attrs: { color: { default: "#FDE047" } },
  inclusive: true,

  // IMPORTANT:
  // Paste/import HTML se highlight auto add NAHI hoga
  // Sirf user toolbar se add karega
  parseDOM: [],

  toDOM(mark) {
    const { color } = mark.attrs;
    return ["mark", { style: `background-color: ${color}` }, 0];
  },
};
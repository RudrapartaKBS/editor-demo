import { MarkSpec } from "prosemirror-model";

export const textColorMark: MarkSpec = {
  attrs: { color: { default: null } },
  inclusive: true,

  // IMPORTANT:
  // Paste/import HTML se textColor auto add NAHI hoga
  // Sirf user toolbar se add karega
  parseDOM: [],

  toDOM(mark) {
    const { color } = mark.attrs;
    return ["span", color ? { style: `color: ${color}` } : {}, 0];
  },
};
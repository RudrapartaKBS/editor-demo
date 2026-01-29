import { MarkSpec } from "prosemirror-model";

export const underline: MarkSpec = {
  parseDOM: [{ tag: "u" }, { style: "text-decoration", getAttrs: (v) => (v === "underline" ? {} : false) }],
  toDOM() {
    return ["u", 0];
  },
};
import { MarkSpec } from "prosemirror-model";

export const fontSizeMark: MarkSpec = {
  attrs: {
    size: { default: "16" }
  },
  parseDOM: [
    {
      style: "font-size",
      getAttrs(value: string) {
        const match = /(\d+)px/.exec(value);
        return match ? { size: match[1] } : false;
      }
    }
  ],
  toDOM(mark) {
    return [
      "span",
      {
        style: `font-size: ${mark.attrs.size}px`
      },
      0
    ];
  }
};
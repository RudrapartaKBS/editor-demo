import { MarkSpec } from "prosemirror-model";

export const linkMark: MarkSpec = {
  attrs: {
    href: { default: "" },
    title: { default: null },
    target: { default: "_blank" }
  },
  inclusive: false,
  parseDOM: [
    {
      tag: "a[href]",
      getAttrs(dom: HTMLElement) {
        const el = dom as HTMLAnchorElement;
        return {
          href: el.getAttribute("href"),
          title: el.getAttribute("title"),
          target: el.getAttribute("target")
        };
      }
    }
  ],
  toDOM(mark) {
    const { href, title, target } = mark.attrs;
    return [
      "a",
      {
        href,
        title: title || null,
        target: target || "_blank",
        rel: "noopener noreferrer"
      },
      0
    ];
  }
};
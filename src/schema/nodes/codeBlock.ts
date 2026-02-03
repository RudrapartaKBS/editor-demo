import { NodeSpec } from "prosemirror-model";

export const codeBlockNode: NodeSpec = {
  content: "text*",
  marks: "",
  group: "block",
  code: true,
  defining: true,
  attrs: {
    language: { default: null },
  },
  
  parseDOM: [
    {
      tag: "pre",
      preserveWhitespace: "full",
      getAttrs(node) {
        const el = node as HTMLElement;
        const code = el.querySelector("code");
        const className = code?.getAttribute("class");
        const language = className?.match(/language-(\w+)/)?.[1] || null;
        return { language };
      },
    },
  ],
  
  toDOM(node) {
    const { language } = node.attrs;
    const langClass = language ? `language-${language}` : "";
    
    return [
      "pre",
      ["code", { class: langClass }, 0],
    ];
  },
};
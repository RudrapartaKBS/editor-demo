import { NodeSpec } from "prosemirror-model";

export const imageNode: NodeSpec = {
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  attrs: {
    src: { default: null },
    alt: { default: "" },
    title: { default: null },
    align: { default: "center" }, // "left" | "right" | "center" | "none"
    width: { default: 320 },
    caption: { default: "" },
    zoomable: { default: true }, // Default to true for better UX
  },
  
  parseDOM: [
    {
      tag: "figure[data-pm-image]",
      getAttrs: (dom: any) => {
        const img = dom.querySelector("img");
        const cap = dom.querySelector("figcaption");
        const w = dom.getAttribute("data-width");
        const align = dom.getAttribute("data-align");
        const zoomable = dom.getAttribute("data-zoomable") === "true";

        const parsedW = w ? parseInt(w, 10) : 320;
        const safeW = Number.isFinite(parsedW) ? parsedW : 320;

        return {
          src: img?.getAttribute("src"),
          alt: img?.getAttribute("alt") || "",
          title: img?.getAttribute("title"),
          caption: cap?.textContent || "",
          width: safeW,
          align: align || "none",
          zoomable,
        };
      },
    },
    // Backward compatibility with simple img tags
    {
      tag: "img[src]",
      getAttrs(dom) {
        const el = dom as HTMLImageElement;
        const align = el.getAttribute("data-align") || 
                     (el.style.float === "left" ? "left" : 
                      el.style.float === "right" ? "right" : "center");
        const zoomable = el.getAttribute("data-zoomable") === "false" ? false : true; // Default to true
        
        return {
          src: el.getAttribute("src"),
          alt: el.getAttribute("alt") || "",
          title: el.getAttribute("title"),
          width: parseInt(el.getAttribute("data-width") || el.getAttribute("width") || "320"),
          align,
          caption: "",
          zoomable,
        };
      },
    },
  ],
  
  toDOM(node) {
    const { src, alt, title, width, align, caption, zoomable } = node.attrs;
    const safeW = Number.isFinite(width) && width > 0 ? width : 320;
    
    const figClasses = `pm-figure pm-figure--${align} ${zoomable ? 'zoomable' : ''}`;
    const imgClasses = zoomable ? 'zoomable' : '';

    return [
      "figure",
      {
        "data-pm-image": "1",
        "data-width": String(safeW),
        "data-align": align,
        "data-zoomable": String(zoomable),
        class: figClasses,
        style: align === "center" 
          ? `max-width: ${safeW}px; margin: 1rem auto;`
          : align === "left" 
          ? `max-width: ${safeW}px; float: left; margin: 0 1rem 1rem 0;`
          : align === "right"
          ? `max-width: ${safeW}px; float: right; margin: 0 0 1rem 1rem;`
          : `max-width: ${safeW}px;`,
      },
      [
        "img", 
        { 
          src, 
          alt, 
          title, 
          loading: "lazy",
          draggable: "false",
          class: imgClasses,
          style: "width: 100%; height: auto;"
        }
      ],
      caption ? ["figcaption", { class: "pm-caption" }, caption] : ["figcaption", { class: "pm-caption pm-caption--empty" }, "Click to add caption"],
    ];
  },
};
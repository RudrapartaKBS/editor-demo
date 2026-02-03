const ALLOWED_TAGS = new Set([
  "P", "BR",
  "STRONG", "B",
  "EM", "I",
  "U",
  "A",
  "UL", "OL", "LI",
  "H1", "H2", "H3", "H4", "H5", "H6",
  "BLOCKQUOTE",
  "CODE", "PRE",
  "SPAN", // Allow span for colors and highlights
  "DIV", // Allow div for certain content
]);

function isSafeHref(href: string) {
  try {
    const u = new URL(href, window.location.origin);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:";
  } catch {
    return false;
  }
}

function unwrap(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

export function sanitizePastedHTML(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const els: Element[] = [];
  while (walker.nextNode()) els.push(walker.currentNode as Element);

  for (const el of els) {
    const tag = el.tagName;

    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
      el.remove();
      continue;
    }

    // unwrap non allowed tags except for some that we want to preserve
    if (!ALLOWED_TAGS.has(tag)) {
      unwrap(el);
      continue;
    }

    // Handle different elements differently
    if (tag === "A") {
      // Keep links with safe hrefs
      const href = (el as HTMLAnchorElement).getAttribute("href") || "";
      const attrs = Array.from(el.attributes).map((a) => a.name);
      for (const name of attrs) {
        if (name !== "href") el.removeAttribute(name);
      }
      
      if (href && isSafeHref(href)) {
        el.setAttribute("href", href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "nofollow noopener noreferrer");
      } else {
        unwrap(el);
      }
    } else if (tag === "SPAN") {
      // Keep span with style for colors and formatting
      const style = el.getAttribute("style") || "";
      const attrs = Array.from(el.attributes).map((a) => a.name);
      for (const name of attrs) el.removeAttribute(name);
      
      // Allow color and background-color styles
      if (style.includes("color:") || style.includes("background-color:")) {
        const cleanStyle = style
          .split(';')
          .filter(rule => rule.includes('color:'))
          .join(';');
        if (cleanStyle) {
          el.setAttribute("style", cleanStyle);
        }
      }
      
      // If no useful styles, unwrap
      if (!el.hasAttributes()) {
        unwrap(el);
      }
    } else if (tag === "DIV") {
      // Convert divs to paragraphs for better structure
      const newEl = document.createElement("P");
      while (el.firstChild) {
        newEl.appendChild(el.firstChild);
      }
      el.parentNode?.replaceChild(newEl, el);
    } else {
      // For other allowed tags, remove most attributes but keep essential ones
      const attrs = Array.from(el.attributes).map((a) => a.name);
      for (const name of attrs) {
        // Keep essential attributes
        if (name !== "type" && name !== "start") {
          el.removeAttribute(name);
        }
      }
    }
  }

  return doc.body.innerHTML;
}
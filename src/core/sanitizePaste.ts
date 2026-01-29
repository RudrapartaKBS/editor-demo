const ALLOWED_TAGS = new Set([
  "P", "BR",
  "STRONG", "B",
  "EM", "I",
  "U",
  "A",
  "UL", "OL", "LI",
  "H1", "H2", "H3", "H4",
  "BLOCKQUOTE",
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

    // unwrap non allowed tags like SPAN, DIV
    if (!ALLOWED_TAGS.has(tag)) {
      unwrap(el);
      continue;
    }

    // remove all attributes
    const attrs = Array.from(el.attributes).map((a) => a.name);
    for (const name of attrs) el.removeAttribute(name);

    // only allow safe href on A
    if (tag === "A") {
      const href = (el as HTMLAnchorElement).getAttribute("href") || "";
      if (href && isSafeHref(href)) {
        el.setAttribute("href", href);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "nofollow noopener noreferrer");
      } else {
        unwrap(el);
      }
    }
  }

  return doc.body.innerHTML;
}
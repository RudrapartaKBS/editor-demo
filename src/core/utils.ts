import type { EditorView } from "prosemirror-view";
import { DOMSerializer } from "prosemirror-model";

/** Resolve selector or element. Crash early if missing. */
export function resolveEl<T extends Element>(target: string | T): T {
  const el = typeof target === "string" ? (document.querySelector(target) as T | null) : target;
  if (!el) throw new Error("MyEditor: element not found");
  return el;
}

/** Convert current document to HTML string. */
export function toHTML(view: EditorView): string {
  const serializer = DOMSerializer.fromSchema(view.state.schema);
  const frag = serializer.serializeFragment(view.state.doc.content);
  const div = document.createElement("div");
  div.appendChild(frag);
  return div.innerHTML;
}

/** Safe JSON stringify wrapper (never throws). */
export function safeJSONStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
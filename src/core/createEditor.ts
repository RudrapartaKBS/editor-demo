import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { DOMParser as PMDOMParser } from "prosemirror-model";

import type { EditorAPI, EditorConfig } from "./types";
import { resolveEl, safeJSONStringify, toHTML } from "./utils";
import { sanitizePastedHTML } from "./sanitizePaste";

import { schema } from "../schema";
import { buildPlugins } from "../plugins";
import { mountToolbar, type ToolbarInstance } from "../ui/toolbar/mountToolbar";

const SCHEMA_VERSION = 1;

function normalizeInitialJSON(input: any) {
  if (!input) return null;
  if (input.doc && typeof input.schemaVersion === "number") return input.doc;
  return input;
}

export function createEditor(target: string | HTMLElement, config: EditorConfig = {}): EditorAPI {
  const host = resolveEl<HTMLElement>(target);

  // Optional textarea binding
  const textareaEl = config.textarea ? resolveEl<HTMLTextAreaElement>(config.textarea) : null;

  // Hidden JSON input (so form submit includes JSON too)
  let hiddenJson: HTMLInputElement | null = null;
  if (textareaEl) {
    textareaEl.style.display = "none";

    hiddenJson = document.createElement("input");
    hiddenJson.type = "hidden";
    hiddenJson.name = textareaEl.name ? `${textareaEl.name}_json` : "content_json";
    textareaEl.insertAdjacentElement("afterend", hiddenJson);
  }

  // Mount container
  host.innerHTML = "";
  const mount = document.createElement("div");
  mount.className = "myeditor-root";
  host.appendChild(mount);

  // Create initial doc
  const initialDocJSON = normalizeInitialJSON(config.initialJSON);

  const doc = initialDocJSON
    ? schema.nodeFromJSON(initialDocJSON)
    : config.initialHTML
    ? PMDOMParser.fromSchema(schema).parse(new DOMParser().parseFromString(config.initialHTML, "text/html"))
    : schema.topNodeType.createAndFill();

  if (!doc) throw new Error("MyEditor: failed to create doc");

  const plugins = buildPlugins(schema, {});
  const state = EditorState.create({ schema, doc, plugins });

  // IMPORTANT: declare toolbar var BEFORE EditorView so dispatchTransaction can access it
  let toolbar: ToolbarInstance | null = null;

  let changeTimer: number | null = null;

  // Create view
  const view = new EditorView(mount, {
    state,
    transformPastedHTML(html) {
      // Strip styling so paste won't create unwanted marks.
      const clean = sanitizePastedHTML(html);
      console.log("RAW:", html);
      console.log("CLEAN:", clean);
      return clean;
    },
    dispatchTransaction(tr) {
      const next = view.state.apply(tr);
      view.updateState(next);

      // Keep toolbar state responsive (selection changes, ...)
      toolbar?.refresh();

      if (changeTimer) window.clearTimeout(changeTimer);
      changeTimer = window.setTimeout(() => {
        const wrappedJSON = { schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() };
        const text = view.state.doc.textBetween(0, view.state.doc.content.size, "\n", "\n");
        const html = config.outputHTML ? toHTML(view) : "";

        // Sync outputs
        if (textareaEl) {
          if (config.outputHTML) textareaEl.value = html; // optional legacy
          if (hiddenJson) hiddenJson.value = safeJSONStringify(wrappedJSON);
        }

        config.onChange?.({ json: wrappedJSON, html, text });
      }, config.debounceMs ?? 80);
    },
  });

  // Mount toolbar after view exists
  if (config.toolbar) {
    toolbar = mountToolbar({
      target: config.toolbar.target,
      view,
      tools: config.toolbar.tools,
    });

    // initial sync
    toolbar.refresh();
  }

  const getValue = () => {
    const json = { schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() };
    const html = config.outputHTML ? toHTML(view) : "";
    const text = view.state.doc.textBetween(0, view.state.doc.content.size, "\n", "\n");
    return { json, html, text };
  };

  return {
    view,
    getJSON: () => ({ schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() }),
    getHTML: () => toHTML(view),
    getValue,
    destroy: () => {
      view.destroy();
      if (textareaEl) textareaEl.style.display = "";
      if (hiddenJson) hiddenJson.remove();
      toolbar?.destroy();
    },
  };
}
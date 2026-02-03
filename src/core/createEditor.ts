import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { DOMParser as PMDOMParser } from "prosemirror-model";

import type { EditorAPI, EditorConfig } from "./types";
import { resolveEl, safeJSONStringify, toHTML } from "./utils";
import { sanitizePastedHTML } from "./sanitizePaste";
import { ImageNodeView } from "./nodeviews/imageNodeView";
import { EmbedNodeView } from "./nodeviews/embedNodeView";

import { schema } from "../schema";
import { buildPlugins } from "../plugins";
import { mountToolbar, type ToolbarInstance } from "../ui/toolbar/mountToolbar";
import { initImageZoom } from "./imageZoom";

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

  console.log('🏗️ Mount container created:', mount);

  // Create initial doc
  const initialDocJSON = normalizeInitialJSON(config.initialJSON);

  let doc;
  if (initialDocJSON) {
    doc = schema.nodeFromJSON(initialDocJSON);
  } else if (config.initialHTML) {
    doc = PMDOMParser.fromSchema(schema).parse(new DOMParser().parseFromString(config.initialHTML, "text/html"));
  } else {
    // Create empty document with a paragraph to make it editable
    doc = schema.topNodeType.create(null, [
      schema.nodes.paragraph.create()
    ]);
  }

  if (!doc) throw new Error("MyEditor: failed to create doc");

  const plugins = buildPlugins(schema, {});
  const state = EditorState.create({ schema, doc, plugins });

  // IMPORTANT: declare toolbar var BEFORE EditorView so dispatchTransaction can access it
  let toolbar: ToolbarInstance | null = null;

  let changeTimer: number | null = null;

  // Create view
  const view = new EditorView(mount, {
    state,
    editable: () => true,
    attributes: {
      class: "ProseMirror",
      spellcheck: "false",
      contenteditable: "true",
      "data-placeholder": config.placeholder || "Start typing...",
      tabindex: "0"
    },    nodeViews: {
      image: (node, view, getPos) => new ImageNodeView(node, view, getPos),
      embed: (node, view, getPos) => new EmbedNodeView(node, view, getPos),
    },    transformPastedHTML(html) {
      // Keep rich formatting while sanitizing dangerous content
      const clean = sanitizePastedHTML(html);
      console.log("RAW PASTE:", html);
      console.log("CLEANED PASTE:", clean);
      return clean;
    },
    dispatchTransaction(tr) {
      console.log('📝 Transaction:', tr.docChanged, tr.steps.length);
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

  console.log('🎯 EditorView created:', view);
  console.log('🔍 Mount element after view:', mount.innerHTML);

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

  // Initialize image zoom functionality
  const imageZoom = initImageZoom();

  const getValue = () => {
    const json = { schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() };
    const html = config.outputHTML ? toHTML(view) : "";
    const text = view.state.doc.textBetween(0, view.state.doc.content.size, "\n", "\n");
    return { json, html, text };
  };

  // Focus editor immediately to make it interactive
  setTimeout(() => {
    view.focus();
  }, 50);

  return {
    view,
    getJSON: () => ({ schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() }),
    getHTML: () => toHTML(view),
    getValue,
    getContent: () => ({ schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() }),
    setContent: (content: any) => {
      const doc = schema.nodeFromJSON(content.doc || content);
      const state = view.state;
      const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
      view.dispatch(tr);
    },
    getText: () => view.state.doc.textBetween(0, view.state.doc.content.size, "\n", "\n"),
    focus: () => view.focus(),
    hasChanges: () => view.state.doc.content.size > 0,
    destroy: () => {
      view.destroy();
      if (textareaEl) textareaEl.style.display = "";
      if (hiddenJson) hiddenJson.remove();
      toolbar?.destroy();
      imageZoom.destroy();
    },
  };
}
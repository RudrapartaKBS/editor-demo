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

export function createEditor(
  target: string | HTMLElement,
  config: EditorConfig = {}
): EditorAPI {
  const host = resolveEl<HTMLElement>(target);

  const textareaEl = config.textarea
    ? resolveEl<HTMLTextAreaElement>(config.textarea)
    : null;

  let hiddenJson: HTMLInputElement | null = null;
  if (textareaEl) {
    textareaEl.style.display = "none";
    hiddenJson = document.createElement("input");
    hiddenJson.type = "hidden";
    hiddenJson.name = textareaEl.name ? `${textareaEl.name}_json` : "content_json";
    textareaEl.insertAdjacentElement("afterend", hiddenJson);
  }

  host.innerHTML = "";

  // ---- Editor mount ----
  const mount = document.createElement("div");
  mount.className = "myeditor-root";
  host.appendChild(mount);

  // ---- Document init ----
  const initialDocJSON = normalizeInitialJSON(config.initialJSON);

  let doc;
  if (initialDocJSON) {
    doc = schema.nodeFromJSON(initialDocJSON);
  } else if (config.initialHTML) {
    doc = PMDOMParser.fromSchema(schema).parse(
      new DOMParser().parseFromString(config.initialHTML, "text/html")
    );
  } else {
    doc = schema.topNodeType.create(null, [schema.nodes.paragraph.create()]);
  }

  // ---- Plugins ----
  // Do NOT rely on onViewUpdate for toolbar sync. We sync from dispatchTransaction.
  const plugins = buildPlugins(schema);

  const state = EditorState.create({ schema, doc, plugins });

  let changeTimer: number | null = null;

  // Baseline snapshot for hasChanges
  let baselineJSON = safeJSONStringify({
    schemaVersion: SCHEMA_VERSION,
    doc: state.doc.toJSON(),
  });

  // Toolbar instance (always mounted)
  let toolbar: ToolbarInstance | null = null;

  const view = new EditorView(mount, {
    state,
    attributes: {
      class: "ProseMirror",
      spellcheck: "false",
      contenteditable: "true",
      "data-placeholder": config.placeholder || "Start typing...",
      tabindex: "0",
    },
    nodeViews: {
      image: (node, view, getPos) => new ImageNodeView(node, view, getPos),
      embed: (node, view, getPos) => new EmbedNodeView(node, view, getPos),
    },

    transformPastedHTML(html) {
      return sanitizePastedHTML(html);
    },

    dispatchTransaction(tr) {
      // ✅ Clear storedMarks on pure selection moves.
      // This prevents "bold stays active" when you click a normal paragraph.
      if (tr.selectionSet && !tr.docChanged) {
        tr = tr.setStoredMarks(null);
      }

      const next = view.state.apply(tr);
      view.updateState(next);

      // ✅ REAL TIME TOOLBAR SYNC (every click, selection change, typing)
      toolbar?.refresh();

      // ---- your existing onChange debounce ----
      if (changeTimer) window.clearTimeout(changeTimer);
      changeTimer = window.setTimeout(() => {
        const wrappedJSON = {
          schemaVersion: SCHEMA_VERSION,
          doc: view.state.doc.toJSON(),
        };

        const text = view.state.doc.textBetween(
          0,
          view.state.doc.content.size,
          "\n",
          "\n"
        );

        const html = config.outputHTML ? toHTML(view) : "";

        if (textareaEl) {
          if (config.outputHTML) textareaEl.value = html;
          if (hiddenJson) hiddenJson.value = safeJSONStringify(wrappedJSON);
        }

        config.onChange?.({ json: wrappedJSON, html, text });
      }, config.debounceMs ?? 80);
    },
  });

  // ---- ALWAYS mount toolbar (no config.toolbar needed) ----
  const toolbarHost = document.createElement("div");
  toolbarHost.className = "myeditor-toolbar-host";
  host.insertBefore(toolbarHost, mount);

  toolbar = mountToolbar({
    target: toolbarHost,
    view,
    useRows: true,
  });
  toolbar.refresh();

  // ---- Image zoom ----
  const imageZoom = initImageZoom();

  const getValue = () => {
    const json = {
      schemaVersion: SCHEMA_VERSION,
      doc: view.state.doc.toJSON(),
    };
    const html = config.outputHTML ? toHTML(view) : "";
    const text = view.state.doc.textBetween(
      0,
      view.state.doc.content.size,
      "\n",
      "\n"
    );
    return { json, html, text };
  };

  const api: EditorAPI = {
    view,

    getJSON: () => ({
      schemaVersion: SCHEMA_VERSION,
      doc: view.state.doc.toJSON(),
    }),

    getHTML: () => toHTML(view),

    getValue,

    getContent: () => ({
      schemaVersion: SCHEMA_VERSION,
      doc: view.state.doc.toJSON(),
    }),

    setContent: (content: any) => {
      try {
        const nextDoc = schema.nodeFromJSON(content?.doc || content);

        const tr = view.state.tr.replaceWith(
          0,
          view.state.doc.content.size,
          nextDoc.content
        );
        view.dispatch(tr);

        baselineJSON = safeJSONStringify({
          schemaVersion: SCHEMA_VERSION,
          doc: view.state.doc.toJSON(),
        });

        // immediate sync
        toolbar?.refresh();
      } catch (err) {
        console.warn("setContent error:", err);
      }
    },

    getText: () =>
      view.state.doc.textBetween(
        0,
        view.state.doc.content.size,
        "\n",
        "\n"
      ),

    focus: () => view.focus(),

    hasChanges: () => {
      const current = safeJSONStringify({
        schemaVersion: SCHEMA_VERSION,
        doc: view.state.doc.toJSON(),
      });
      return current !== baselineJSON;
    },

    insertContent: (text: string) => {
      const { tr, selection } = view.state;
      view.dispatch(tr.insertText(text, selection.from, selection.to));
      toolbar?.refresh();
    },

    insertHTML: (html: string) => {
      const clean = sanitizePastedHTML(html);
      const parser = PMDOMParser.fromSchema(schema);
      const parsed = parser.parse(
        new DOMParser().parseFromString(clean, "text/html").body
      );
      const { tr, selection } = view.state;
      view.dispatch(tr.replaceWith(selection.from, selection.to, parsed.content));
      toolbar?.refresh();
    },

    getWordCount: () => {
      const text = view.state.doc.textBetween(
        0,
        view.state.doc.content.size,
        " ",
        " "
      );
      return text.trim() ? text.trim().split(/\s+/).length : 0;
    },

    destroy: () => {
      if (changeTimer) {
        window.clearTimeout(changeTimer);
        changeTimer = null;
      }

      view.destroy();
      toolbar?.destroy();
      imageZoom.destroy();

      if (textareaEl) textareaEl.style.display = "";
      if (hiddenJson) hiddenJson.remove();
    },
  };

  setTimeout(() => {
    view.focus();
    toolbar?.refresh();
  }, 50);

  return api;
}









// import { EditorState } from "prosemirror-state";
// import { EditorView } from "prosemirror-view";
// import { DOMParser as PMDOMParser } from "prosemirror-model";

// import type { EditorAPI, EditorConfig } from "./types";
// import { resolveEl, safeJSONStringify, toHTML } from "./utils";
// import { sanitizePastedHTML } from "./sanitizePaste";
// import { ImageNodeView } from "./nodeviews/imageNodeView";
// import { EmbedNodeView } from "./nodeviews/embedNodeView";

// import { schema } from "../schema";
// import { buildPlugins } from "../plugins";
// import { mountToolbar, type ToolbarInstance } from "../ui/toolbar/mountToolbar";
// import { initImageZoom } from "./imageZoom";

// const SCHEMA_VERSION = 1;

// function normalizeInitialJSON(input: any) {
//   if (!input) return null;
//   if (input.doc && typeof input.schemaVersion === "number") return input.doc;
//   return input;
// }

// export function createEditor(target: string | HTMLElement, config: EditorConfig = {}): EditorAPI {
//   const host = resolveEl<HTMLElement>(target);

//   // Optional textarea binding
//   const textareaEl = config.textarea ? resolveEl<HTMLTextAreaElement>(config.textarea) : null;

//   // Hidden JSON input (so form submit includes JSON too)
//   let hiddenJson: HTMLInputElement | null = null;
//   if (textareaEl) {
//     textareaEl.style.display = "none";

//     hiddenJson = document.createElement("input");
//     hiddenJson.type = "hidden";
//     hiddenJson.name = textareaEl.name ? `${textareaEl.name}_json` : "content_json";
//     textareaEl.insertAdjacentElement("afterend", hiddenJson);
//   }

//   // Mount container
//   host.innerHTML = "";
//   const mount = document.createElement("div");
//   mount.className = "myeditor-root";
//   host.appendChild(mount);

//   // console.log('🏗️ Mount container created:', mount);

//   // Create initial doc
//   const initialDocJSON = normalizeInitialJSON(config.initialJSON);

//   let doc;
//   if (initialDocJSON) {
//     doc = schema.nodeFromJSON(initialDocJSON);
//   } else if (config.initialHTML) {
//     doc = PMDOMParser.fromSchema(schema).parse(new DOMParser().parseFromString(config.initialHTML, "text/html"));
//   } else {
//     // Create empty document with a paragraph to make it editable
//     doc = schema.topNodeType.create(null, [
//       schema.nodes.paragraph.create()
//     ]);
//   }

//   if (!doc) throw new Error("MyEditor: failed to create doc");

//   const plugins = buildPlugins(schema, {});
//   const state = EditorState.create({ schema, doc, plugins });

//   // IMPORTANT: declare toolbar var BEFORE EditorView so dispatchTransaction can access it
//   let toolbar: ToolbarInstance | null = null;

//   let changeTimer: number | null = null;

//   // Create enhanced view with better paste handling
//   const view = new EditorView(mount, {
//     state,
//     editable: () => true,
//     attributes: {
//       class: "ProseMirror",
//       spellcheck: "false",
//       contenteditable: "true",
//       "data-placeholder": config.placeholder || "Start typing...",
//       tabindex: "0"
//     },
//     nodeViews: {
//       image: (node, view, getPos) => new ImageNodeView(node, view, getPos),
//       embed: (node, view, getPos) => new EmbedNodeView(node, view, getPos),
//     },
//     transformPastedHTML(html) {
//       // Keep rich formatting while sanitizing dangerous content
//       const clean = sanitizePastedHTML(html);
//       console.log("RAW PASTE:", html);
//       console.log("CLEANED PASTE:", clean);
      
//       // Process cleaned HTML to ensure images have proper attributes
//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = clean;
      
//       const images = tempDiv.querySelectorAll('img');
//       images.forEach(img => {
//         // Detect alignment from style or attributes
//         let align = 'center';
//         const imgStyle = img.getAttribute('style') || '';
//         if (imgStyle.includes('float: left') || img.getAttribute('align') === 'left') {
//           align = 'left';
//         } else if (imgStyle.includes('float: right') || img.getAttribute('align') === 'right') {
//           align = 'right';
//         }
        
//         // Set proper data attributes for MyEditor
//         img.setAttribute('data-align', align);
//         img.setAttribute('data-zoomable', 'true');
//         img.setAttribute('data-caption', '');
        
//         // Add default dimensions if missing (important for resize)
//         const width = img.getAttribute('width') || img.getAttribute('data-width') || '400';
//         const height = img.getAttribute('height') || img.getAttribute('data-height') || '300';
//         img.setAttribute('data-width', width);
//         img.setAttribute('data-height', height);
        
//         // Ensure proper alt and title attributes
//         if (!img.getAttribute('alt')) {
//           img.setAttribute('alt', 'Pasted image');
//         }
//         if (!img.getAttribute('title')) {
//           img.setAttribute('title', img.getAttribute('alt') || 'Pasted image');
//         }
//       });
      
//       return tempDiv.innerHTML;
//     },
//     handlePaste(view, event, slice) {
//       // Handle file drops/pastes (including images)
//       const clipboardData = event.clipboardData;
//       if (clipboardData?.files.length) {
//         const files = Array.from(clipboardData.files);
//         const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
//         if (imageFiles.length > 0) {
//           event.preventDefault();
          
//           imageFiles.forEach(file => {
//             const reader = new FileReader();
//             reader.onload = (e) => {
//               const dataUrl = e.target?.result as string;
//               if (dataUrl) {
//                 const { tr } = view.state;
//                 const imageNode = schema.nodes.image.create({
//                   src: dataUrl,
//                   alt: file.name || "Pasted image",
//                   title: file.name || "Pasted image", 
//                   width: 400,
//                   height: 300,
//                   align: 'center',
//                   caption: '',
//                   zoomable: true // Ensure pasted images are zoomable
//                 });
                
//                 const newTr = tr.replaceSelectionWith(imageNode);
//                 view.dispatch(newTr);
                
//                 // Focus and select the new image
//                 setTimeout(() => {
//                   view.focus();
//                   // Refresh zoom listeners for new image
//                   imageZoom.refresh();
//                 }, 10);
//               }
//             };
//             reader.readAsDataURL(file);
//           });
          
//           return true; // Prevent default paste handling
//         }
//       }
      
//       // Let ProseMirror handle other paste operations
//       return false;
//     },
    
//     // dispatchTransaction(tr) {
//     //   // console.log('📝 Transaction:', tr.docChanged, tr.steps.length);
//     //   const next = view.state.apply(tr);
//     //   view.updateState(next);

//     //   // console.log("this is toolbar==??", tr, "this is fata===????",toolbar);
      

//     //   // Keep toolbar state responsive (selection changes, ...)
//     //   toolbar?.refresh();

//     //   if (changeTimer) window.clearTimeout(changeTimer);
//     //   changeTimer = window.setTimeout(() => {
//     //     const wrappedJSON = { schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() };
//     //     const text = view.state.doc.textBetween(0, view.state.doc.content.size, "\n", "\n");
//     //     const html = config.outputHTML ? toHTML(view) : "";

//     //     // Sync outputs
//     //     if (textareaEl) {
//     //       if (config.outputHTML) textareaEl.value = html; // optional legacy
//     //       if (hiddenJson) hiddenJson.value = safeJSONStringify(wrappedJSON);
//     //     }

//     //     config.onChange?.({ json: wrappedJSON, html, text });
//     //   }, config.debounceMs ?? 80);
//     // },

//     dispatchTransaction(tr) {
//       const next = view.state.apply(tr);
//       const prevState = view.state;

//       console.log("this is working>>>>>");
      

//       view.updateState(next);

//       // 🔥 Refresh only when selection OR doc changed
//       if (
//         tr.docChanged ||
//         !prevState.selection.eq(next.selection)
//       ) {
//         toolbar?.refresh();
//       }

//       if (changeTimer) window.clearTimeout(changeTimer);
//       changeTimer = window.setTimeout(() => {
//         const wrappedJSON = {
//           schemaVersion: SCHEMA_VERSION,
//           doc: view.state.doc.toJSON(),
//         };

//         const text = view.state.doc.textBetween(
//           0,
//           view.state.doc.content.size,
//           "\n",
//           "\n"
//         );

//         const html = config.outputHTML ? toHTML(view) : "";

//         if (textareaEl) {
//           if (config.outputHTML) textareaEl.value = html;
//           if (hiddenJson) hiddenJson.value = safeJSONStringify(wrappedJSON);
//         }

//         config.onChange?.({ json: wrappedJSON, html, text });
//       }, config.debounceMs ?? 80);
//     }



//   });

//   // console.log('🎯 EditorView created:', view);
//   // console.log('🔍 Mount element after view:', mount.innerHTML);

//   // Mount toolbar after view exists
//   if (config.toolbar) {
//     toolbar = mountToolbar({
//       target: config.toolbar.target,
//       view,
//       tools: config.toolbar.tools,
//       useSections: config.toolbar.useSections,
//       useRows: config.toolbar.useRows, // Default to horizontal single row
//     });

//     // initial sync
//     toolbar?.refresh();

//     // Listen for selection changes and refresh toolbar
//     // view.dom.addEventListener('mouseup', () => {
//     //   console.log("mouse up working ==>>>");
      
//     //   setTimeout(() => toolbar?.refresh(), 0);
//     // });
//     // view.dom.addEventListener('keyup', (e) => {
//     //   // Only refresh for navigation keys
//     //   if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","PageUp","PageDown"].includes(e.key)) {
//     //     setTimeout(() => toolbar?.refresh(), 0);
//     //   }
//     // });
//   }

//   // Initialize image zoom functionality
//   const imageZoom = initImageZoom();

//   const getValue = () => {
//     const json = { schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() };
//     const html = config.outputHTML ? toHTML(view) : "";
//     const text = view.state.doc.textBetween(0, view.state.doc.content.size, "\n", "\n");
//     return { json, html, text };
//   };

//   // Enhanced API with additional utility methods
//   const api: EditorAPI = {
//     view,
//     getJSON: () => ({ schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() }),
//     getHTML: () => toHTML(view),
//     getValue,
//     getContent: () => ({ schemaVersion: SCHEMA_VERSION, doc: view.state.doc.toJSON() }),
//     setContent: (content: any) => {
//       try {
//         const doc = schema.nodeFromJSON(content.doc || content);
//         const state = view.state;
//         const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
//         view.dispatch(tr);
//       } catch (error) {
//         console.warn("Error setting content:", error);
//       }
//     },
//     getText: () => view.state.doc.textBetween(0, view.state.doc.content.size, "\n", "\n"),
//     focus: () => {
//       view.focus();
//       // Ensure cursor is visible after focus
//       setTimeout(() => {
//         const { selection } = view.state;
//         view.dispatch(view.state.tr.setSelection(selection));
//       }, 10);
//     },
//     hasChanges: () => view.state.doc.content.size > 0,
//     // Enhanced utility methods
//     insertContent: (content: string) => {
//       const { tr, selection } = view.state;
//       tr.insertText(content, selection.from, selection.to);
//       view.dispatch(tr);
//     },
//     insertHTML: (html: string) => {
//       const cleanHTML = sanitizePastedHTML(html);
//       const parser = PMDOMParser.fromSchema(schema);
//       const doc = parser.parse(new DOMParser().parseFromString(cleanHTML, 'text/html').body);
//       const { tr, selection } = view.state;
//       tr.replaceWith(selection.from, selection.to, doc.content);
//       view.dispatch(tr);
//     },
//     getWordCount: () => {
//       const text = view.state.doc.textBetween(0, view.state.doc.content.size, " ", " ");
//       return text.trim() ? text.trim().split(/\s+/).length : 0;
//     },
//     destroy: () => {
//       view.destroy();
//       if (textareaEl) textareaEl.style.display = "";
//       if (hiddenJson) hiddenJson.remove();
//       toolbar?.destroy();
//       imageZoom.destroy();
//     },
//   };

//   // Focus editor immediately to make it interactive
//   setTimeout(() => {
//     view.focus();
//   }, 50);

//   return api;
// }
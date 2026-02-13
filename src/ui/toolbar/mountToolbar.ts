import type { EditorView } from "prosemirror-view";
import type { Tool } from "../../core/types";
import { resolveEl } from "../../core/utils";
import { TOOLBAR_SECTIONS, TOOLBAR_ROWS } from "./tools";

type Args = {
  target: string | HTMLElement;
  view: EditorView;
  tools?: Tool[];
  useSections?: boolean;
  useRows?: boolean;
};

export type ToolbarInstance = {
  refresh: () => void;
  destroy: () => void;
};

export function mountToolbar({
  target,
  view,
  tools,
  useSections = false,
  useRows = false,
}: Args): ToolbarInstance {
  const host = resolveEl<HTMLElement>(target);

  const bar = document.createElement("div");
  bar.className = useRows ? "myeditor-toolbar myeditor-toolbar--rows" : "myeditor-toolbar";
  host.insertBefore(bar, host.firstChild);

  const buttons = new Map<string, HTMLButtonElement>();
  const dropdowns = new Map<string, HTMLSelectElement>();

  // Default to horizontal single-row layout with all tools
  if (!tools && !useRows && !useSections) {
    const allTools = TOOLBAR_ROWS.flatMap((row) => row.tools);
    allTools.forEach((tool, index) => {
      if (index > 0 && shouldAddSeparator(tool, allTools[index - 1])) {
        const separator = document.createElement("div");
        separator.className = "myeditor-separator";
        bar.appendChild(separator);
      }
      renderTool(tool, bar);
    });
  } else if (useRows && !tools) {
    TOOLBAR_ROWS.forEach((row) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "myeditor-toolbar-row";

      row.tools.forEach((tool, toolIndex) => {
        if (toolIndex > 0 && shouldAddSeparator(tool, row.tools[toolIndex - 1])) {
          const separator = document.createElement("div");
          separator.className = "myeditor-separator";
          rowDiv.appendChild(separator);
        }
        renderTool(tool, rowDiv);
      });

      bar.appendChild(rowDiv);
    });
  } else if (useSections && !tools) {
    TOOLBAR_SECTIONS.forEach((section, sectionIndex) => {
      if (sectionIndex > 0) {
        const separator = document.createElement("div");
        separator.className = "myeditor-separator";
        bar.appendChild(separator);
      }

      const sectionDiv = document.createElement("div");
      sectionDiv.className = "myeditor-section";
      sectionDiv.setAttribute("data-section", section.id);

      section.tools.forEach((tool) => {
        renderTool(tool, sectionDiv);
      });

      bar.appendChild(sectionDiv);
    });
  } else {
    (tools || []).forEach((tool) => renderTool(tool, bar));
  }

  function shouldAddSeparator(_currentTool: Tool, previousTool: Tool): boolean {
    const separatorAfter = ["blockType", "underline", "orderedList", "redo", "image"];
    return separatorAfter.includes(previousTool.id);
  }


  function renderTool(tool: Tool, container: HTMLElement = bar) {
    if (tool.type === "button") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "myeditor-btn";
      btn.textContent = tool.label;

      if (tool.title) {
        btn.title = tool.title;
        btn.setAttribute("data-tooltip", tool.title);
      }

      btn.addEventListener("click", () => {
        view.focus();
        tool.run(view, btn);
        refresh();
      });

      container.appendChild(btn);
      buttons.set(tool.id, btn);
      return;
    }

    if (tool.type === "dropdown") {
      const select = document.createElement("select");
      select.className = "myeditor-select";

      if (tool.title) {
        select.title = tool.title;
        select.setAttribute("data-tooltip", tool.title);
      }

      // CKEditor-like mixed selection placeholder
      if (tool.getValue) {
        const mixed = document.createElement("option");
        mixed.value = "";
        mixed.textContent = "Mixed";
        mixed.disabled = true;
        mixed.hidden = true;
        select.appendChild(mixed);
      }

      for (const opt of tool.options) {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        select.appendChild(o);
      }

      select.addEventListener("change", () => {
        view.focus();
        tool.onSelect(view, select.value);
        refresh();
      });

      container.appendChild(select);
      dropdowns.set(tool.id, select);
      return;
    }

    if (tool.type === "color") {
      const wrap = document.createElement("div");
      wrap.className = "myeditor-color";

      if (tool.title) {
        wrap.title = tool.title;
        wrap.setAttribute("data-tooltip", tool.title);
      }

      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "myeditor-btn";
      clear.textContent = tool.clearLabel ?? "Remove";
      clear.title = "Remove color";

      clear.addEventListener("click", () => {
        view.focus();
        tool.onClear(view);
        refresh();
      });

      wrap.appendChild(clear);

      for (const c of tool.colors) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "myeditor-color-btn";
        b.style.background = c;
        b.title = `Apply color: ${c}`;
        b.addEventListener("click", () => {
          view.focus();
          tool.onPick(view, c);
          refresh();
        });
        wrap.appendChild(b);
      }

      container.appendChild(wrap);
    }
  }

  function refresh() {
    console.log("TOOLBAR REFRESH", view.state.selection.from, view.state.selection.to);

    let allTools: Tool[] = [];

    if (!tools && !useRows && !useSections) {
      allTools = TOOLBAR_ROWS.flatMap((row) => row.tools);
    } else if (useRows && !tools) {
      allTools = TOOLBAR_ROWS.flatMap((row) => row.tools);
    } else if (useSections && !tools) {
      allTools = TOOLBAR_SECTIONS.flatMap((section) => section.tools);
    } else {
      allTools = tools || [];
    }

    for (const tool of allTools) {

      
      // if (tool.type === "button") {
      //   const btn = buttons.get(tool.id);
      //   if (!btn) continue;

      //   const active = tool.isActive ? tool.isActive(view) : false;
      //   const enabled = tool.isEnabled ? tool.isEnabled(view) : true;

      //   btn.classList.toggle("is-active", !!active);
      //   btn.disabled = !enabled;
      //   continue;
      // }

      if (tool.type === "button") {

        // ✅ DEBUG ONLY (button tools only)
        if (tool.id === "bold") {
          const sel = view.state.selection;
          const $from = sel.$from;

          console.log("BOLD_DEBUG", {
            from: sel.from,
            to: sel.to,
            empty: sel.empty,
            parentType: $from.parent.type.name,
            parentText: $from.parent.textContent,
            marksAtCursor: $from.marks().map(m => m.type.name),
          });
        }

        const btn = buttons.get(tool.id);
        if (!btn) continue;

        const active = tool.isActive ? tool.isActive(view) : false;
        const enabled = tool.isEnabled ? tool.isEnabled(view) : true;

        btn.classList.toggle("is-active", !!active);
        btn.disabled = !enabled;
        continue;
      }

      if (tool.type === "dropdown") {
        const select = dropdowns.get(tool.id);
        if (!select) continue;

        if (tool.getValue) {
          const v = tool.getValue(view);

          if (v == null) {
            if (select.value !== "") select.value = "";
          } else if (typeof v === "string" && v.trim() !== "") {
            const exists = Array.from(select.options).some(
              (o) => (o as HTMLOptionElement).value === v,
            );
            if (exists && select.value !== v) select.value = v;
          }
        }

        continue;
      }
    }
  }

  refresh();

  return {
    refresh,
    destroy: () => {
      bar.remove();
    },
  };
}










// import type { EditorView } from "prosemirror-view";
// import type { Tool } from "../../core/types";
// import { resolveEl } from "../../core/utils";
// import { TOOLBAR_SECTIONS, TOOLBAR_ROWS } from "./tools";

// type Args = {
//   target: string | HTMLElement;
//   view: EditorView;
//   tools?: Tool[];
//   useSections?: boolean;
//   useRows?: boolean;
// };

// export type ToolbarInstance = {
//   refresh: () => void;
//   destroy: () => void;
// };

// export function mountToolbar({ target, view, tools, useSections = false, useRows = false }: Args): ToolbarInstance {
//   const host = resolveEl<HTMLElement>(target);
  
//   // Don't clear existing content - just add toolbar to the top
//   const bar = document.createElement("div");
//   bar.className = useRows ? "myeditor-toolbar myeditor-toolbar--rows" : "myeditor-toolbar";
//   host.insertBefore(bar, host.firstChild);

//   const buttons = new Map<string, HTMLButtonElement>();
//   const dropdowns = new Map<string, HTMLSelectElement>();

//   // Default to horizontal single-row layout with all tools
//   if (!tools && !useRows && !useSections) {
//     // Use all tools in horizontal layout
//     const allTools = TOOLBAR_ROWS.flatMap(row => row.tools);
//     allTools.forEach((tool, index) => {
//       if (index > 0 && shouldAddSeparator(tool, allTools[index - 1])) {
//         const separator = document.createElement("div");
//         separator.className = "myeditor-separator";
//         bar.appendChild(separator);
//       }
//       renderTool(tool, bar, buttons, dropdowns, view, refresh);
//     });
//   } else if (useRows && !tools) {
//     // Use two-row layout
//     TOOLBAR_ROWS.forEach((row, rowIndex) => {
//       const rowDiv = document.createElement("div");
//       rowDiv.className = "myeditor-toolbar-row";
      
//       row.tools.forEach((tool, toolIndex) => {
//         if (toolIndex > 0 && shouldAddSeparator(tool, row.tools[toolIndex - 1])) {
//           const separator = document.createElement("div");
//           separator.className = "myeditor-separator";
//           rowDiv.appendChild(separator);
//         }
//         renderTool(tool, rowDiv, buttons, dropdowns, view, refresh);
//       });
      
//       bar.appendChild(rowDiv);
//     });
//   } else if (useSections && !tools) {
//     // Use organized sections (legacy)
//     TOOLBAR_SECTIONS.forEach((section, sectionIndex) => {
//       if (sectionIndex > 0) {
//         // Add separator before each section (except first)
//         const separator = document.createElement("div");
//         separator.className = "myeditor-separator";
//         bar.appendChild(separator);
//       }

//       // Add section container
//       const sectionDiv = document.createElement("div");
//       sectionDiv.className = "myeditor-section";
//       sectionDiv.setAttribute("data-section", section.id);
      
//       // Render tools in this section
//       section.tools.forEach(tool => {
//         renderTool(tool, sectionDiv, buttons, dropdowns, view, refresh);
//       });
      
//       bar.appendChild(sectionDiv);
//     });
//   } else {
//     // Use custom tools list
//     const toolsToRender = tools || [];
//     toolsToRender.forEach(tool => {
//       renderTool(tool, bar, buttons, dropdowns, view, refresh);
//     });
//   }

//   // Helper function to determine if separator is needed
//   function shouldAddSeparator(currentTool: Tool, previousTool: Tool): boolean {
//     // Add separators after specific tools for logical grouping
//     const separatorAfter = ["blockType", "underline", "orderedList", "redo", "image"];
//     return separatorAfter.includes(previousTool.id);
//   }

//   function renderTool(
//     tool: Tool, 
//     container: HTMLElement, 
//     buttons: Map<string, HTMLButtonElement>, 
//     dropdowns: Map<string, HTMLSelectElement>,
//     view: EditorView,
//     refresh: () => void
//   ) {
//     if (tool.type === "button") {
//       const btn = document.createElement("button");
//       btn.type = "button";
//       btn.className = "myeditor-btn";
//       btn.textContent = tool.label;
      
//       // Enhanced tooltip
//       if (tool.title) {
//         btn.title = tool.title;
//         btn.setAttribute("data-tooltip", tool.title);
//       }

//       btn.addEventListener("click", () => {
//         view.focus();
//         tool.run(view, btn);
//         refresh();
//       });

//       container.appendChild(btn);
//       buttons.set(tool.id, btn);
//       return;
//     }

//     if (tool.type === "dropdown") {
//       const select = document.createElement("select");
//       select.className = "myeditor-select";
      
//       // Enhanced tooltip
//       if (tool.title) {
//         select.title = tool.title;
//         select.setAttribute("data-tooltip", tool.title);
//       }

//       for (const opt of tool.options) {
//         const o = document.createElement("option");
//         o.value = opt.value;
//         o.textContent = opt.label;
//         select.appendChild(o);
//       }

//       select.addEventListener("change", () => {
//         view.focus();
//         tool.onSelect(view, select.value);
//         refresh();
//       });

//       container.appendChild(select);

//       // IMPORTANT: dropdown ko map me store karo, warna refresh() update nahi kar paayega
//       dropdowns.set(tool.id, select);
//       return;
//     }

//     if (tool.type === "color") {
//       const wrap = document.createElement("div");
//       wrap.className = "myeditor-color";
      
//       // Enhanced tooltip for color tool
//       if (tool.title) {
//         wrap.title = tool.title;
//         wrap.setAttribute("data-tooltip", tool.title);
//       }

//       const clear = document.createElement("button");
//       clear.type = "button";
//       clear.className = "myeditor-btn";
//       clear.textContent = tool.clearLabel ?? "Remove";
//       clear.title = "Remove color";
//       clear.addEventListener("click", () => {
//         view.focus();
//         tool.onClear(view);
//         refresh();
//       });
//       wrap.appendChild(clear);

//       for (const c of tool.colors) {
//         const b = document.createElement("button");
//         b.type = "button";
//         b.className = "myeditor-color-btn";
//         b.style.background = c;
//         b.title = `Apply color: ${c}`;
//         b.addEventListener("click", () => {
//           view.focus();
//           tool.onPick(view, c);
//           refresh();
//         });
//         wrap.appendChild(b);
//       }

//       container.appendChild(wrap);
//       return;
//     }
//   }

//   function refresh() {
//     // Get all tools from rows, sections, or flat list
//     let allTools: Tool[] = [];
    
//     if (useRows && !tools) {
//       allTools = TOOLBAR_ROWS.flatMap(row => row.tools);
//     } else if (useSections && !tools) {
//       allTools = TOOLBAR_SECTIONS.flatMap(section => section.tools);
//     } else {
//       allTools = tools || [];
//     }

//     for (const tool of allTools) {
//       if (tool.type === "button") {
//         const btn = buttons.get(tool.id);
//         if (!btn) continue;

//         const active = tool.isActive ? tool.isActive(view) : false;
//         const enabled = tool.isEnabled ? tool.isEnabled(view) : true;

//         btn.classList.toggle("is-active", !!active);
//         btn.disabled = !enabled;
//         continue;
//       }

//       if (tool.type === "dropdown") {
//         const select = dropdowns.get(tool.id);
//         if (!select) continue;

//         if (tool.getValue) {
//           const v = tool.getValue(view);

//           // Only update if we have a valid string value
//           if (typeof v === "string" && v.trim() !== "") {
//             const exists = Array.from(select.options).some(o => o.value === v);

//             if (exists && select.value !== v) {
//               select.value = v;
//             }
//           }
//           // If v is null/undefined (mixed selection), don't change dropdown value
//           // This prevents showing stale/incorrect values
//         }

//         continue;
//       }

//     }
//   }

//   refresh();

//   return {
//     refresh,
//     destroy: () => {
//       bar.remove();
//     },
//   };
// }
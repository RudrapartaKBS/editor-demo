import type { EditorView } from "prosemirror-view";
import type { Tool } from "../../core/types";
import { resolveEl } from "../../core/utils";

type Args = {
  target: string | HTMLElement;
  view: EditorView;
  tools: Tool[];
};

export type ToolbarInstance = {
  refresh: () => void;
  destroy: () => void;
};

export function mountToolbar({ target, view, tools }: Args): ToolbarInstance {
  const host = resolveEl<HTMLElement>(target);
  
  // Don't clear existing content - just add toolbar to the top
  const bar = document.createElement("div");
  bar.className = "myeditor-toolbar";
  host.insertBefore(bar, host.firstChild);

  const buttons = new Map<string, HTMLButtonElement>();
  const dropdowns = new Map<string, HTMLSelectElement>();

  for (const tool of tools) {
    if (tool.type === "button") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "myeditor-btn";
      btn.textContent = tool.label;
      if (tool.title) btn.title = tool.title;

      btn.addEventListener("click", () => {
        view.focus();
        tool.run(view, btn);
        refresh();
      });

      bar.appendChild(btn);
      buttons.set(tool.id, btn);
      continue;
    }

    if (tool.type === "dropdown") {
      const select = document.createElement("select");
      select.className = "myeditor-select";
      if (tool.title) select.title = tool.title;

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

      bar.appendChild(select);

      // IMPORTANT: dropdown ko map me store karo, warna refresh() update nahi kar paayega
      dropdowns.set(tool.id, select);

      continue;
    }

    if (tool.type === "color") {
      const wrap = document.createElement("div");
      wrap.className = "myeditor-color";

      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "myeditor-btn";
      clear.textContent = tool.clearLabel ?? "Remove";
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
        b.addEventListener("click", () => {
          view.focus();
          tool.onPick(view, c);
          refresh();
        });
        wrap.appendChild(b);
      }

      bar.appendChild(wrap);
      continue;
    }
  }

  function refresh() {
    for (const tool of tools) {
      if (tool.type === "button") {
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
          select.value = tool.getValue(view);
        }
        continue;
      }
    }
  }

  refresh();

  return {
    refresh,
    destroy: () => {
      host.innerHTML = "";
    },
  };
}
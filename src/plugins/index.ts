import { Plugin } from "prosemirror-state";
import type { Schema } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { history } from "prosemirror-history";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";

import { editorKeymap } from "./keymap";

type BuildPluginsOptions = {
  onViewUpdate?: () => void; // ✅ toolbar sync hook
};

export function buildPlugins(_schema: Schema, opts: BuildPluginsOptions = {}) {
  const plugins: Plugin[] = [];

  // ✅ This plugin fires on every view update (selection/doc/transactions)
  if (opts.onViewUpdate) {
    plugins.push(
      new Plugin({
        view() {
          return {
            update() {
              opts.onViewUpdate?.();
            },
          };
        },
      })
    );
  }

  plugins.push(history());
  plugins.push(editorKeymap());
  plugins.push(keymap(baseKeymap));
  plugins.push(dropCursor());
  plugins.push(gapCursor());

  return plugins;
}



// import type { Plugin } from "prosemirror-state";
// import type { Schema } from "prosemirror-model";
// import { keymap } from "prosemirror-keymap";
// import { baseKeymap, splitBlock } from "prosemirror-commands";
// import { history } from "prosemirror-history";
// import { dropCursor } from "prosemirror-dropcursor";
// import { gapCursor } from "prosemirror-gapcursor";

// import { editorKeymap } from "./keymap";

// type BuildPluginsOptions = {
//   // future: onUpdate hooks etc.
// };

// export function buildPlugins(_schema: Schema, _opts: BuildPluginsOptions = {}) {
//   const plugins: Plugin[] = [];

//   plugins.push(history());

//   // Custom shortcuts first (highest priority)
//   plugins.push(editorKeymap());

//   // Base keymap as fallback (lowest priority)
//   plugins.push(keymap(baseKeymap));

//   plugins.push(dropCursor());
//   plugins.push(gapCursor());

//   return plugins;
// }
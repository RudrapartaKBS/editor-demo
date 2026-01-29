import type { Plugin } from "prosemirror-state";
import type { Schema } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { history } from "prosemirror-history";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";

import { editorKeymap } from "./keymap";

type BuildPluginsOptions = {
  // future: onUpdate hooks etc.
};

export function buildPlugins(_schema: Schema, _opts: BuildPluginsOptions = {}) {
  const plugins: Plugin[] = [];

  plugins.push(history());

  // Custom shortcuts first (override behavior if needed)
  plugins.push(editorKeymap());

  // Base keymap fallback
  plugins.push(keymap(baseKeymap));

  plugins.push(dropCursor());
  plugins.push(gapCursor());

  return plugins;
}
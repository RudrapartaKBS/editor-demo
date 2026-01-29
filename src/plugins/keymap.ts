import { keymap } from "prosemirror-keymap";
import { toggleMark } from "prosemirror-commands";
import type { Plugin } from "prosemirror-state";

/**
 * Custom editor shortcuts.
 * Keep ALL keyboard shortcuts here.
 */
export function editorKeymap(): Plugin {
  return keymap({
    // Underline
    "Mod-u": (state, dispatch, view) => {
      const mark = state.schema.marks.underline;
      if (!mark) return false;
      return toggleMark(mark)(state, dispatch, view as any);
    },
  });
}
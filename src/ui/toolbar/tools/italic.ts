import type { Tool } from "../../../core/types";
import { canItalic, isItalicActive, toggleItalic } from "../../../commands";

export const italicTool: Tool = {
  id: "italic",
  label: "I",
  title: "Italic (Ctrl/Cmd+I)",
  shortcut: "Mod-i",
  isActive: (view) => isItalicActive(view.state),
  isEnabled: (view) => canItalic(view.state),
//   run: (view) => toggleItalic(view.state, view.dispatch, view),
  run: (view) => toggleItalic(view.state, view.dispatch),
};
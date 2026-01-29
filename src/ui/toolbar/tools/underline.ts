import type { Tool } from "../../../core/types";
import { canUnderline, isUnderlineActive, toggleUnderline } from "../../../commands";

export const underlineTool: Tool = {
  id: "underline",
  label: "U",
  title: "Underline (Ctrl/Cmd+U)",
  shortcut: "Mod-u",
  isActive: (view) => isUnderlineActive(view.state),
  isEnabled: (view) => canUnderline(view.state),
//   run: (view) => toggleUnderline(view.state, view.dispatch, view),
  run: (view) => toggleUnderline(view.state, view.dispatch),
};
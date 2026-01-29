import type { Tool } from "../../../core/types";
import { canUnderline, isUnderlineActive, toggleUnderline } from "../../../commands";

export const underlineTool: Tool = {
  type: "button",
  id: "underline",
  label: "U",
  title: "Underline (Ctrl/Cmd+U)",
  isActive: (view) => isUnderlineActive(view.state),
  isEnabled: (view) => canUnderline(view.state),
  run: (view) => toggleUnderline(view.state, view.dispatch),
};
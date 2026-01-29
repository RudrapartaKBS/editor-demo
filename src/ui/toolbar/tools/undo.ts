import type { Tool } from "../../../core/types";
import { canUndo, runUndo } from "../../../commands";

export const undoTool: Tool = {
  type: "button",
  id: "undo",
  label: "↶",
  title: "Undo (Ctrl/Cmd+Z)",
  isEnabled: (view) => canUndo(view.state),
  run: (view) => runUndo(view.state, view.dispatch, view),
};
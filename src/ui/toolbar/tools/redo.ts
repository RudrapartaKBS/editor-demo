import type { Tool } from "../../../core/types";
import { canRedo, runRedo } from "../../../commands";

export const redoTool: Tool = {
  type: "button",
  id: "redo",
  label: "↷",
  title: "Redo (Ctrl/Cmd+Shift+Z)",
  isEnabled: (view) => canRedo(view.state),
  run: (view) => runRedo(view.state, view.dispatch, view),
};
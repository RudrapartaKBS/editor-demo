// import type { Tool } from "../../../core/types";
// import { canBold, isBoldActive, toggleBold } from "../../../commands";

// export const boldTool: Tool = {
//   id: "bold",
//   label: "B",
//   title: "Bold (Ctrl/Cmd+B)",
//   shortcut: "Mod-b",
//   isActive: (view) => isBoldActive(view.state),
//   isEnabled: (view) => canBold(view.state),
//   run: (view) => toggleBold(view.state, view.dispatch, view),
// //   run: (view) => toggleBold(view.state, view.dispatch),
// };
import type { Tool } from "../../../core/types";
import { canBold, isBoldActive, toggleBold } from "../../../commands";

export const boldTool: Tool = {
  type: "button",            // ✅ missing tha
  id: "bold",
  label: "B",
  title: "Bold (Ctrl/Cmd+B)",
  isActive: (view) => isBoldActive(view.state),
  isEnabled: (view) => canBold(view.state),
  run: (view) => toggleBold(view.state, view.dispatch, view),
};
export { createEditor } from "./core/createEditor";
export { mountToolbar } from "./ui/toolbar/mountToolbar";

// IMPORTANT: tools export for CDN usage
export { DEFAULT_TOOLS } from "./ui/toolbar/tools";

// optional: individual tool exports (nice for custom toolbars)
export {
  undoTool,
  redoTool,
  blockTypeTool,
  boldTool,
  italicTool,
  underlineTool,
  textColorTool,
  highlightTool,
  bulletListTool,
  orderedListTool,
  quoteTool,
} from "./ui/toolbar/tools";

export type {
  EditorAPI,
  EditorConfig,
  EditorOutput,
  ToolbarConfig,
  Tool,
} from "./core/types";



// // Public JS entry (no forced CSS side effects)

// export { createEditor } from "./core/createEditor";
// export { mountToolbar } from "./ui/toolbar/mountToolbar";

// export type {
//   EditorAPI,
//   EditorConfig,
//   EditorOutput,
//   ToolbarConfig,
//   Tool,
// } from "./core/types";

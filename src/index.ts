// Import styles for bundled builds
import "./styles";

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
  imageTool,
  codeBlockTool,
} from "./ui/toolbar/tools";

export type {
  EditorAPI,
  EditorConfig,
  EditorOutput,
  ToolbarConfig,
  Tool,
} from "./core/types";

// Media utilities for custom upload handling
export {
  validateFile,
  uploadToDataUrl,
  uploadToServer,
  compressImage,
  createThumbnail,
  DEFAULT_UPLOAD_CONFIG,
  type UploadConfig,
} from "./core/mediaUtils";



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

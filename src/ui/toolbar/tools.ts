import type { Tool } from "../../core/types";
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  isBoldActive,
  isItalicActive,
  isUnderlineActive,
  canBold,
  canItalic,
  canUnderline,
  setTextColor,
  setHighlight,
} from "../../commands/marks";
import { runUndo, runRedo, canUndo, canRedo } from "../../commands/history";
import { setParagraph, setHeading, toggleBlockquote } from "../../commands/blocks";
import { toggleBulletList, toggleOrderedList } from "../../commands/lists";

export const undoTool: Tool = {
  type: "button",
  id: "undo",
  label: "↶",
  title: "Undo",
  isEnabled: (view) => canUndo(view.state),
  run: (view) => runUndo(view.state, view.dispatch, view),
};

export const redoTool: Tool = {
  type: "button",
  id: "redo",
  label: "↷",
  title: "Redo",
  isEnabled: (view) => canRedo(view.state),
  run: (view) => runRedo(view.state, view.dispatch, view),
};

export const blockTypeTool: Tool = {
  type: "dropdown",
  id: "blockType",
  title: "Block type",
  options: [
    { label: "Paragraph", value: "p" },
    { label: "Heading 1", value: "h1" },
    { label: "Heading 2", value: "h2" },
  ],
  getValue(view) {
    const { $from } = view.state.selection;
    const node = $from.parent;
    if (node.type.name === "heading") {
      return node.attrs.level === 1 ? "h1" : "h2";
    }
    return "p";
  },
  onSelect(view, value) {
    if (value === "p") setParagraph(view.state, view.dispatch);
    if (value === "h1") setHeading(1)(view.state, view.dispatch);
    if (value === "h2") setHeading(2)(view.state, view.dispatch);
  },
};

export const boldTool: Tool = {
  type: "button",
  id: "bold",
  label: "B",
  title: "Bold",
  isActive: (view) => isBoldActive(view.state),
  isEnabled: (view) => canBold(view.state),
  run: (view) => toggleBold(view.state, view.dispatch, view),
};

export const italicTool: Tool = {
  type: "button",
  id: "italic",
  label: "I",
  title: "Italic",
  isActive: (view) => isItalicActive(view.state),
  isEnabled: (view) => canItalic(view.state),
  run: (view) => toggleItalic(view.state, view.dispatch),
};

export const underlineTool: Tool = {
  type: "button",
  id: "underline",
  label: "U",
  title: "Underline",
  isActive: (view) => isUnderlineActive(view.state),
  isEnabled: (view) => canUnderline(view.state),
  run: (view) => toggleUnderline(view.state, view.dispatch),
};

export const bulletListTool: Tool = {
  type: "button",
  id: "bulletList",
  label: "• List",
  title: "Bullet list",
  run: (view) => toggleBulletList(view.state, view.dispatch),
};

export const orderedListTool: Tool = {
  type: "button",
  id: "orderedList",
  label: "1. List",
  title: "Ordered list",
  run: (view) => toggleOrderedList(view.state, view.dispatch),
};

export const quoteTool: Tool = {
  type: "button",
  id: "blockquote",
  label: "❝",
  title: "Blockquote",
  run: (view) => toggleBlockquote(view.state, view.dispatch),
};

export const textColorTool: Tool = {
  type: "color",
  id: "textColor",
  title: "Text color",
  clearLabel: "Remove color",
  colors: ["#111827", "#dc2626", "#f59e0b", "#16a34a", "#2563eb", "#7c3aed"],
  onPick: (view, color) => setTextColor(color)(view.state, view.dispatch),
  onClear: (view) => setTextColor(null)(view.state, view.dispatch),
};

export const highlightTool: Tool = {
  type: "color",
  id: "highlight",
  title: "Highlight",
  clearLabel: "Remove highlight",
  colors: ["#fde047", "#a7f3d0", "#bfdbfe", "#fecaca", "#e9d5ff"],
  onPick: (view, color) => setHighlight(color)(view.state, view.dispatch),
  onClear: (view) => setHighlight(null)(view.state, view.dispatch),
};

export const DEFAULT_TOOLS: Tool[] = [
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
];
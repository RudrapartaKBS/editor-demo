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
} from "../../commands/marks";
import { runUndo, runRedo, canUndo, canRedo } from "../../commands/history";
import { setParagraph, setHeading, toggleBlockquote } from "../../commands/blocks";
import { toggleBulletList, toggleOrderedList } from "../../commands/lists";
import { toggleCodeBlock, isCodeBlockActive } from "../../commands/codeBlock";
import { createImageUploadDialog, createEnhancedImageDialog } from "../../commands/media";
import { createEmbedDialog } from "../../commands/embed";
import { createLinkDialog, isLinkActive } from "../../commands/link";
import { increaseFontSize, decreaseFontSize } from "../../commands/fontSize";
import { textColorTool } from "./tools/textColor";
import { highlightTool } from "./tools/highlight";

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
    { label: "Heading 3", value: "h3" },
  ],
  getValue(view) {
    const { $from } = view.state.selection;
    const node = $from.parent;
    if (node.type.name === "heading") {
      const level = node.attrs.level;
      if (level === 1) return "h1";
      if (level === 2) return "h2";
      if (level === 3) return "h3";
    }
    return "p";
  },
  onSelect(view, value) {
    if (value === "p") setParagraph(view.state, view.dispatch);
    if (value === "h1") setHeading(1)(view.state, view.dispatch);
    if (value === "h2") setHeading(2)(view.state, view.dispatch);
    if (value === "h3") setHeading(3)(view.state, view.dispatch);
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


export const imageTool: Tool = {
  type: "button",
  id: "image",
  label: "🖼️",
  title: "Insert Image",
  run: (view) => {
    const overlay = createEnhancedImageDialog(view);
    document.body.appendChild(overlay);
    return true;
  },
};

export const linkTool: Tool = {
  type: "button",
  id: "link",
  label: "🔗",
  title: "Add Link",
  isActive: (view) => isLinkActive(view.state),
  run: (view) => {
    const dialog = createLinkDialog(view);
    document.body.appendChild(dialog);
    return true;
  },
};

export const fontSizeIncreaseTool: Tool = {
  type: "button",
  id: "fontSizeIncrease",
  label: "A+",
  title: "Increase Font Size",
  run: (view) => {
    increaseFontSize()(view.state, view.dispatch);
    return true;
  },
};

export const fontSizeDecreaseTool: Tool = {
  type: "button",
  id: "fontSizeDecrease", 
  label: "A-",
  title: "Decrease Font Size",
  run: (view) => {
    decreaseFontSize()(view.state, view.dispatch);
    return true;
  },
};

export const embedTool: Tool = {
  type: "button",
  id: "embed",
  label: "🎬",
  title: "Embed Media",
  run: (view) => {
    const overlay = createEmbedDialog(view);
    document.body.appendChild(overlay);
    return true;
  },
};

export const codeBlockTool: Tool = {
  type: "button",
  id: "codeBlock",
  label: "</>",
  title: "Code Block",
  isActive: (view) => isCodeBlockActive(view.state),
  run: (view) => toggleCodeBlock()(view.state, view.dispatch),
};

// Two-row toolbar layout - properly organized
export const TOOLBAR_ROWS: { id: string; tools: Tool[] }[] = [
  {
    id: "row1",
    tools: [
      blockTypeTool,
      boldTool,
      italicTool,
      underlineTool,
      bulletListTool,
      orderedListTool,
      undoTool,
      redoTool,
      linkTool,
      imageTool,
      quoteTool,
    ]
  },
  {
    id: "row2", 
    tools: [
      fontSizeIncreaseTool,
      fontSizeDecreaseTool,
      textColorTool,
      highlightTool,
      embedTool,
      codeBlockTool,
    ]
  }
];

// Organized toolbar sections (backward compatibility)
export const TOOLBAR_SECTIONS: { id: string; label: string; tools: Tool[] }[] = [
  {
    id: "history",
    label: "History",
    tools: [undoTool, redoTool]
  },
  {
    id: "blocks",
    label: "Blocks",
    tools: [blockTypeTool]
  },
  {
    id: "formatting",
    label: "Text Formatting",
    tools: [boldTool, italicTool, underlineTool]
  },
  {
    id: "typography",
    label: "Typography",
    tools: [fontSizeIncreaseTool, fontSizeDecreaseTool, textColorTool, highlightTool]
  },
  {
    id: "links",
    label: "Links & Media",
    tools: [linkTool, imageTool, embedTool]
  },
  {
    id: "code",
    label: "Code",
    tools: [codeBlockTool]
  },
  {
    id: "lists",
    label: "Lists & Quotes",
    tools: [bulletListTool, orderedListTool, quoteTool]
  }
];

export const DEFAULT_TOOLS: Tool[] = [
  undoTool,
  redoTool,
  blockTypeTool,
  boldTool,
  italicTool,
  underlineTool,
  fontSizeIncreaseTool,
  fontSizeDecreaseTool,
  textColorTool,
  highlightTool,
  linkTool,
  imageTool,
  embedTool,
  codeBlockTool,
  bulletListTool,
  orderedListTool,
  quoteTool,
];

// Re-export textColorTool for individual imports
export { textColorTool };
export { highlightTool };
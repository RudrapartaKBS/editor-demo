import type { Tool } from "../../../core/types";
import { setParagraph } from "../../../commands/blocks";

export const paragraphTool: Tool = {
  type: "button",   // ← ye missing tha
  id: "paragraph",
  label: "P",
  title: "Paragraph",
  run: (view) => setParagraph(view.state, view.dispatch),
};
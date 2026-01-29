import type { Tool } from "../../../core/types";
import { toggleBlockquote } from "../../../commands/blocks";

export const quoteTool: Tool = {
  type: "button",
  id: "quote",
  label: "❝",
  title: "Blockquote",
  run: (view) => toggleBlockquote(view.state, view.dispatch),
};
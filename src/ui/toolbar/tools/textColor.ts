import type { Tool } from "../../../core/types";
import { setTextColor } from "../../../commands/marks";

export const textColorTool: Tool = {
  id: "text_color",
  label: "A",
  title: "Text color (hex)",
  run: (view) => {
    const hex = prompt("Text color hex (#RRGGBB). Empty to clear:", "#22D3EE");
    if (!hex) return setTextColor(null)(view.state, view.dispatch);
    return setTextColor(hex)(view.state, view.dispatch);
  },
};
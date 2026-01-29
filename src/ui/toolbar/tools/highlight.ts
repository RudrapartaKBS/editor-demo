import type { Tool } from "../../../core/types";
import { setHighlight } from "../../../commands/marks";

export const highlightTool: Tool = {
  id: "highlight",
  label: "🖍",
  title: "Highlight (hex)",
  run: (view) => {
    const hex = prompt("Highlight hex (#RRGGBB). Empty to clear:", "#FDE047");
    if (!hex) return setHighlight(null)(view.state, view.dispatch);
    return setHighlight(hex)(view.state, view.dispatch);
  },
};
import "./demo.css";
import "../src/styles";
import { createEditor } from "../src";

import {
  DEFAULT_TOOLS,
  // ya individual:
  // undoTool, redoTool, blockTypeTool, boldTool, italicTool, underlineTool,
  // textColorTool, highlightTool, bulletListTool, orderedListTool, quoteTool,
} from "../src/ui/toolbar/tools";

const statusText = document.getElementById("statusText") as HTMLElement;
const out = document.getElementById("out") as HTMLElement;

createEditor("#editor", {
  textarea: "#desc",
  toolbar: {
    target: "#toolbar",
    tools: DEFAULT_TOOLS,
  },
  onChange: ({ json }) => {
    out.textContent = JSON.stringify(json, null, 2);
    statusText.textContent = "Editing";
  },
});

document.getElementById("copyJson")!.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(out.textContent || "");
    statusText.textContent = "Copied JSON";
    setTimeout(() => (statusText.textContent = "Editing"), 900);
  } catch {
    statusText.textContent = "Copy failed";
  }
});
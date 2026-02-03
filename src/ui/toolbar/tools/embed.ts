import { EditorView } from "prosemirror-view";
import { createEmbedDialog } from "../../../commands/embed";

export const embedTool = {
  name: "embed",
  title: "Embed Media",
  icon: "🎬",
  action: (view: EditorView) => {
    const dialog = createEmbedDialog(view);
    document.body.appendChild(dialog);
  },
  isActive: () => false,
  isEnabled: () => true,
};
import { EditorView } from "prosemirror-view";
import { createLinkDialog, isLinkActive } from "../../../commands/link";

export const linkTool = {
  name: "link",
  title: "Add Link",
  icon: "🔗",
  action: (view: EditorView) => {
    const dialog = createLinkDialog(view);
    document.body.appendChild(dialog);
  },
  isActive: (view: EditorView) => isLinkActive(view.state),
  isEnabled: () => true,
};
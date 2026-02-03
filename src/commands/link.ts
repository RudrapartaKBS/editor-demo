import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export function toggleLink(href: string, title?: string, target?: string) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { schema, selection } = state;
    const linkMark = schema.marks.link;

    if (!linkMark) return false;

    const { from, to } = selection;
    const markType = linkMark;
    
    // Check if link is already applied
    const mark = markType.isInSet(state.doc.resolve(from).marks());
    
    if (mark && !href) {
      // Remove link
      if (dispatch) {
        dispatch(state.tr.removeMark(from, to, markType));
      }
      return true;
    }
    
    // Add link
    if (dispatch && href) {
      const attrs = { href, title: title || null, target: target || "_blank" };
      dispatch(state.tr.addMark(from, to, markType.create(attrs)));
    }
    
    return true;
  };
}

export function isLinkActive(state: EditorState): boolean {
  const { schema, selection } = state;
  const linkMark = schema.marks.link;
  
  if (!linkMark) return false;
  
  const { from } = selection;
  return !!linkMark.isInSet(state.doc.resolve(from).marks());
}

export function getLinkAttrs(state: EditorState) {
  const { schema, selection } = state;
  const linkMark = schema.marks.link;
  
  if (!linkMark) return null;
  
  const { from } = selection;
  const mark = linkMark.isInSet(state.doc.resolve(from).marks());
  
  return mark ? mark.attrs : null;
}

export function createLinkDialog(view: EditorView): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "myeditor-overlay";
  
  const dialog = document.createElement("div");
  dialog.className = "myeditor-link-dialog myeditor-enhanced-dialog";
  
  const currentAttrs = getLinkAttrs(view.state);
  const isEditing = !!currentAttrs;
  
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>🔗 ${isEditing ? 'Edit' : 'Insert'} Link</h3>
      <button class="dialog-close" type="button" aria-label="Close">✕</button>
    </div>
    
    <div class="dialog-body">
      <div class="form-group">
        <label>URL:</label>
        <input type="url" class="url-input" placeholder="https://example.com" value="${currentAttrs?.href || ''}">
      </div>
      
      <div class="form-group">
        <label>Title (optional):</label>
        <input type="text" class="title-input" placeholder="Link description" value="${currentAttrs?.title || ''}">
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" class="target-checkbox" ${currentAttrs?.target === '_blank' ? 'checked' : ''}> 
          Open in new tab
        </label>
      </div>
      
      ${isEditing ? '<div class="form-group"><button type="button" class="btn-remove">Remove Link</button></div>' : ''}
    </div>
    
    <div class="dialog-actions">
      <button type="button" class="btn-cancel">Cancel</button>
      <button type="button" class="btn-insert">${isEditing ? 'Update' : 'Insert'} Link</button>
    </div>
  `;

  const urlInput = dialog.querySelector(".url-input") as HTMLInputElement;
  const titleInput = dialog.querySelector(".title-input") as HTMLInputElement;
  const targetCheckbox = dialog.querySelector(".target-checkbox") as HTMLInputElement;
  const insertBtn = dialog.querySelector(".btn-insert") as HTMLButtonElement;
  const cancelBtn = dialog.querySelector(".btn-cancel") as HTMLButtonElement;
  const closeBtn = dialog.querySelector(".dialog-close") as HTMLButtonElement;
  const removeBtn = dialog.querySelector(".btn-remove") as HTMLButtonElement;

  // Validation
  const validateUrl = () => {
    const url = urlInput.value.trim();
    insertBtn.disabled = !url;
  };

  urlInput.addEventListener("input", validateUrl);
  validateUrl();

  // Close handlers
  const closeDialog = () => {
    overlay.remove();
    view.focus();
  };

  cancelBtn.addEventListener("click", closeDialog);
  closeBtn.addEventListener("click", closeDialog);
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDialog();
  });

  // Remove link
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      toggleLink("")(view.state, view.dispatch);
      closeDialog();
    });
  }

  // Insert/update link
  insertBtn.addEventListener("click", () => {
    const href = urlInput.value.trim();
    const title = titleInput.value.trim();
    const target = targetCheckbox.checked ? "_blank" : "_self";

    if (href) {
      toggleLink(href, title, target)(view.state, view.dispatch);
      closeDialog();
    }
  });

  // Auto-focus
  setTimeout(() => urlInput.focus(), 100);

  overlay.appendChild(dialog);
  return overlay;
}
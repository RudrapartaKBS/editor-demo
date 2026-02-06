import { NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { FaExpandArrowsAlt } from "react-icons/fa";


function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export class ImageNodeView implements NodeView {
  node: Node;
  view: any;
  getPos: any;

  dom: HTMLElement;
  img: HTMLImageElement;
  cap: HTMLElement;
  handle: HTMLElement;
  controls: HTMLElement;

  private isResizing = false;
  private isDestroyed = false;
  private onMove?: (e: MouseEvent | TouchEvent) => void;
  private onUp?: () => void;

  constructor(node: Node, view: any, getPos: any) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    const { src, alt, title, width, align, caption, zoomable } = node.attrs;
    const safeW = Number.isFinite(width) && width > 0 ? width : 320;

    // Create figure container
    const fig = document.createElement("figure");
    fig.className = `pm-figure pm-figure--${align} ${zoomable ? 'zoomable' : ''}`;
    fig.setAttribute("data-pm-image", "1");
    fig.setAttribute("data-width", String(safeW));
    fig.setAttribute("data-align", String(align));
    fig.setAttribute("data-zoomable", String(zoomable));

    // Apply styles based on alignment
    if (align === "center") {
      fig.style.maxWidth = `${safeW}px`;
      fig.style.margin = "1rem auto";
    } else if (align === "left") {
      fig.style.maxWidth = `${safeW}px`;
      fig.style.float = "left";
      fig.style.margin = "0 1rem 1rem 0";
    } else if (align === "right") {
      fig.style.maxWidth = `${safeW}px`;
      fig.style.float = "right";
      fig.style.margin = "0 0 1rem 1rem";
    } else {
      fig.style.maxWidth = `${safeW}px`;
    }

    // Create image
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt || "";
    if (title) img.title = title;
    img.loading = "lazy";
    img.draggable = false;
    img.style.width = "100%";
    img.style.height = "auto";
    if (zoomable) img.className = "zoomable";

    // Create caption (re-enable editing)
    const cap = document.createElement("figcaption");
    cap.className = caption ? "pm-caption" : "pm-caption pm-caption--empty";
    cap.contentEditable = "plaintext-only"; // Force plain text only
    cap.textContent = caption || "Click to add caption";
    cap.setAttribute("title", "Click to edit caption");
    cap.setAttribute("data-pm-caption", "true");
    cap.style.outline = "none"; // Remove browser focus outline
    cap.setAttribute("spellcheck", "true");

    // Create resize handle with proper cursor
    const handle = document.createElement("div");
    handle.className = "pm-resize-handle";
    handle.innerHTML = "&#8690;";
    handle.setAttribute("title", "Drag to resize");
    handle.style.cursor = "col-resize";
    handle.style.userSelect = "none";

    // Create controls for alignment, zoom, and editing
    const controls = document.createElement("div");
    controls.className = "pm-image-controls";

    this.updateControlsLayout(controls, safeW);

    // Assemble DOM
    fig.appendChild(img);
    fig.appendChild(handle);
    fig.appendChild(cap);
    fig.appendChild(controls);

    this.dom = fig;
    this.img = img;
    this.cap = cap;
    this.handle = handle;
    this.controls = controls;

    this.bindEvents();

    // Add class for easier targeting and better visibility
    this.dom.addEventListener('mouseenter', () => {
      this.dom.classList.add('pm-figure--hovered');
    });

    this.dom.addEventListener('mouseleave', () => {
      this.dom.classList.remove('pm-figure--hovered');
    });

    // Show controls when image is clicked
    this.img.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dom.classList.add('pm-figure--selected');
      // Remove from other images
      document.querySelectorAll('.pm-figure--selected').forEach(fig => {
        if (fig !== this.dom) fig.classList.remove('pm-figure--selected');
      });
    });
  }

  updateControlsLayout(controls: HTMLElement, width: number) {
    const { align, zoomable } = this.node.attrs;

    // Determine layout based on width
    if (width <= 250) {
      // Compact layout for small images
      controls.innerHTML = `
        <div class="pm-controls-row">
          <select class="pm-align-select" title="Alignment">
            <option value="none" ${align === 'none' ? 'selected' : ''}>None</option>
            <option value="left" ${align === 'left' ? 'selected' : ''}>L</option>
            <option value="center" ${align === 'center' ? 'selected' : ''}>C</option>
            <option value="right" ${align === 'right' ? 'selected' : ''}>R</option>
          </select>
          <label title="Zoomable">
            <input type="checkbox" class="pm-zoom-checkbox" ${zoomable ? 'checked' : ''}> 
            🔍
          </label>
          <button class="pm-edit-btn" title="Edit">✏️</button>
          <button class="pm-delete-btn" title="Delete">🗑️</button>
        </div>
      `;
    } else if (width <= 400) {
      // Medium layout
      controls.innerHTML = `
        <div class="pm-controls-row">
          <select class="pm-align-select">
            <option value="none" ${align === 'none' ? 'selected' : ''}>None</option>
            <option value="left" ${align === 'left' ? 'selected' : ''}>Left</option>
            <option value="center" ${align === 'center' ? 'selected' : ''}>Center</option>
            <option value="right" ${align === 'right' ? 'selected' : ''}>Right</option>
          </select>
          <label>
            <input type="checkbox" class="pm-zoom-checkbox" ${zoomable ? 'checked' : ''}>            
            Zoom
          </label>
          <button type="button" class="pm-edit-btn" title="Edit image properties">✏️</button>
          <button type="button" class="pm-delete-btn" title="Delete image">🗑️</button>
        </div>
      `;
    } else {
      // Full layout for large images
      controls.innerHTML = `
        <div class="pm-controls-row">
          <label>Align:</label>
          <select class="pm-align-select">
            <option value="none" ${align === 'none' ? 'selected' : ''}>None</option>
            <option value="left" ${align === 'left' ? 'selected' : ''}>Left</option>
            <option value="center" ${align === 'center' ? 'selected' : ''}>Center</option>
            <option value="right" ${align === 'right' ? 'selected' : ''}>Right</option>
          </select>
          <label>
            <input type="checkbox" class="pm-zoom-checkbox" ${zoomable ? 'checked' : ''}> 
            Zoomable
          </label>
          <button type="button" class="pm-edit-btn" title="Edit image properties">✏️</button>
          <button type="button" class="pm-delete-btn" title="Delete image">🗑️</button>
        </div>
      `;
    }
  }

  bindEvents() {
    // Resize functionality
    this.bindResize();

    // Caption editing functionality
    this.cap.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.cap.focus();
    });

    this.cap.addEventListener("focus", (e) => {
      e.stopPropagation();
      if (this.cap.className.includes("pm-caption--empty")) {
        this.cap.textContent = "";
        this.cap.className = "pm-caption";
      }
    });

    this.cap.addEventListener("blur", (e) => {
      e.stopPropagation();
      const newCaption = this.cap.textContent?.trim() || "";

      // Only update if caption actually changed
      if (newCaption !== this.node.attrs.caption) {
        this.updateAttrs({ caption: newCaption });
      }

      if (!newCaption) {
        this.cap.textContent = "Click to add caption";
        this.cap.className = "pm-caption pm-caption--empty";
      } else {
        this.cap.className = "pm-caption";
      }
    });

    this.cap.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.cap.blur();
        return false;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.cap.blur();
        return false;
      }
      // Stop propagation for all other keys while editing
      e.stopPropagation();
    });

    // Prevent caption events from bubbling to the editor
    this.cap.addEventListener("keyup", (e) => {
      e.stopPropagation();
    });

    this.cap.addEventListener("keypress", (e) => {
      e.stopPropagation();
    });

    this.cap.addEventListener("input", (e) => {
      e.stopPropagation();
    });

    // Handle paste events to prevent duplication
    this.cap.addEventListener("paste", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Get plain text from clipboard and insert it
      const clipboardData = e.clipboardData;
      if (clipboardData) {
        const text = clipboardData.getData('text/plain');
        if (text) {
          // Clean the text - remove any HTML tags and format characters
          const cleanText = text.replace(/<[^>]*>/g, '').replace(/[\n\r]/g, ' ').trim();

          if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
            // Modern approach - insert plain text only
            document.execCommand('insertText', false, cleanText);
          } else {
            // Fallback - direct text insertion
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(document.createTextNode(cleanText));
              range.collapse(false);
            }
          }
        }
      }
      return false;
    });

    // Handle copy/cut events to prevent propagation
    this.cap.addEventListener("copy", (e) => {
      e.stopPropagation();
    });

    this.cap.addEventListener("cut", (e) => {
      e.stopPropagation();
    });

    // Handle drag and drop to prevent rich content
    this.cap.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Only allow plain text drops
      const text = e.dataTransfer?.getData('text/plain');
      if (text) {
        const cleanText = text.replace(/<[^>]*>/g, '').replace(/[\n\r]/g, ' ').trim();
        document.execCommand('insertText', false, cleanText);
      }
      return false;
    });

    this.cap.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Controls functionality
    this.syncControlsWithAttrs();
    this.bindControlEvents();

    // Add keyboard shortcuts for image when selected
    this.dom.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();

        if (confirm("Delete this image?")) {
          const pos = this.getPos();
          if (typeof pos === "number") {
            const tr = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
            this.view.dispatch(tr);
          }
        }
      }

      // Handle Enter key to insert paragraph after image (regardless of alignment)
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        const pos = this.getPos();
        if (typeof pos === "number") {
          const insertPos = pos + this.node.nodeSize;
          const paragraph = this.view.state.schema.nodes.paragraph.create();
          const tr = this.view.state.tr.insert(insertPos, paragraph);
          this.view.dispatch(tr);

          // Focus the new paragraph
          setTimeout(() => {
            this.view.focus();
            const newPos = insertPos + 1; // Position inside the new paragraph
            const selection = TextSelection.create(this.view.state.doc, newPos);
            this.view.dispatch(this.view.state.tr.setSelection(selection));
          }, 10);
        }
      }

      // Handle Arrow keys for better navigation around floated images
      if ((e.key === "ArrowDown" || e.key === "ArrowRight") && this.node.attrs.align !== "center") {
        const pos = this.getPos();
        if (typeof pos === "number") {
          const afterPos = pos + this.node.nodeSize;
          if (afterPos < this.view.state.doc.content.size) {
            e.preventDefault();
            const selection = TextSelection.create(this.view.state.doc, afterPos);
            this.view.dispatch(this.view.state.tr.setSelection(selection));
            this.view.focus();
          }
        }
      }
    });

    // Show controls on hover and selection
    this.dom.addEventListener("mouseenter", () => {
      this.controls.style.display = "block";
    });

    this.dom.addEventListener("mouseleave", (e) => {
      // Only hide if not actively using controls
      const related = e.relatedTarget as HTMLElement;
      if (!this.controls.contains(related) && !this.dom.classList.contains('ProseMirror-selectednode')) {
        setTimeout(() => {
          if (!this.dom.matches(':hover')) {
            this.controls.style.display = "none";
          }
        }, 100);
      }
    });

    // Prevent editor focus loss when using controls
    this.controls.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    this.controls.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  bindResize() {
    let startX = 0;
    let startW = 0;
    let isDragging = false;
    let startY = 0;
    let startH = 0;

    this.onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isResizing || !isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
      const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;

      // Calculate new dimensions maintaining aspect ratio
      const nextW = clamp(startW + dx, 100, 1200);
      const aspectRatio = startH / startW;
      const nextH = Math.round(nextW * aspectRatio);

      // Update visual immediately for smooth feedback
      this.dom.style.maxWidth = `${nextW}px`;
      this.dom.setAttribute("data-width", String(nextW));

      // Debounce actual state update
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = window.setTimeout(() => {
        this.updateAttrs({ width: nextW, height: nextH });
      }, 100);
    };

    this.onUp = () => {
      isDragging = false;
      this.isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.style.pointerEvents = "";

      if (this.onMove) {
        window.removeEventListener("mousemove", this.onMove as any);
        window.removeEventListener("touchmove", this.onMove as any);
      }
      if (this.onUp) {
        window.removeEventListener("mouseup", this.onUp);
        window.removeEventListener("touchend", this.onUp);
      }

      this.handle.style.cursor = "nwse-resize";

      // Clear any pending resize updates
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = undefined;
      }
    };

    // Mouse events
    this.handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      this.isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = Number(this.node.attrs.width) || 320;
      startH = Number(this.node.attrs.height) || 240;

      document.body.style.cursor = "nwse-resize";
      document.body.style.userSelect = "none";
      document.body.style.pointerEvents = "none";

      if (this.onMove) {
        window.addEventListener("mousemove", this.onMove);
        window.addEventListener("touchmove", this.onMove, { passive: false });
      }
      if (this.onUp) {
        window.addEventListener("mouseup", this.onUp);
        window.addEventListener("touchend", this.onUp);
      }
    });

    // Touch events for mobile
    this.handle.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      isDragging = true;
      this.isResizing = true;
      startX = touch.clientX;
      startY = touch.clientY;
      startW = Number(this.node.attrs.width) || 320;
      startH = Number(this.node.attrs.height) || 240;

      if (this.onMove) {
        window.addEventListener("touchmove", this.onMove, { passive: false });
      }
      if (this.onUp) {
        window.addEventListener("touchend", this.onUp);
      }
    });

    // Add proper cursor
    this.handle.style.cursor = "nwse-resize";
    this.handle.style.touchAction = "none";
  }

  private resizeTimeout: number | undefined;

  bindControlEvents() {
    const alignSelect = this.controls.querySelector(".pm-align-select") as HTMLSelectElement;
    const zoomCheckbox = this.controls.querySelector(".pm-zoom-checkbox") as HTMLInputElement;
    const editBtn = this.controls.querySelector(".pm-edit-btn") as HTMLButtonElement;
    const deleteBtn = this.controls.querySelector(".pm-delete-btn") as HTMLButtonElement;

    if (alignSelect) {
      // Remove existing listeners by cloning the element
      const newAlignSelect = alignSelect.cloneNode(true) as HTMLSelectElement;
      alignSelect.parentNode?.replaceChild(newAlignSelect, alignSelect);

      // Set value and add fresh listener
      newAlignSelect.value = this.node.attrs.align || 'center';

      newAlignSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Align changed to:', newAlignSelect.value);
        this.updateAttrs({ align: newAlignSelect.value });
      });

      // Ensure dropdown is clickable
      newAlignSelect.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
    }

    if (zoomCheckbox) {
      // Remove existing listeners by cloning the element
      const newZoomCheckbox = zoomCheckbox.cloneNode(true) as HTMLInputElement;
      zoomCheckbox.parentNode?.replaceChild(newZoomCheckbox, zoomCheckbox);

      // Set value and add fresh listener
      newZoomCheckbox.checked = this.node.attrs.zoomable !== false;

      newZoomCheckbox.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Zoom changed to:', newZoomCheckbox.checked);
        this.updateAttrs({ zoomable: newZoomCheckbox.checked });
      });

      // Make label clickable
      const label = newZoomCheckbox.closest('label');
      if (label) {
        label.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    }

    if (editBtn) {
      // Remove existing listeners by cloning the element
      const newEditBtn = editBtn.cloneNode(true) as HTMLButtonElement;
      editBtn.parentNode?.replaceChild(newEditBtn, editBtn);

      newEditBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openImageEditDialog();
      });
    }

    if (deleteBtn) {
      // Remove existing listeners by cloning the element
      const newDeleteBtn = deleteBtn.cloneNode(true) as HTMLButtonElement;
      deleteBtn.parentNode?.replaceChild(newDeleteBtn, deleteBtn);

      newDeleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        if (confirm("Delete this image?")) {
          const pos = this.getPos();
          if (typeof pos === "number") {
            const tr = this.view.state.tr.delete(pos, pos + this.node.nodeSize);
            this.view.dispatch(tr);
          }
        }
      });
    }
  }

  private syncControlsWithAttrs() {
    const alignSelect = this.controls.querySelector(".pm-align-select") as HTMLSelectElement;
    const zoomCheckbox = this.controls.querySelector(".pm-zoom-checkbox") as HTMLInputElement;

    if (alignSelect) {
      alignSelect.value = this.node.attrs.align || 'center';
    }

    if (zoomCheckbox) {
      zoomCheckbox.checked = this.node.attrs.zoomable !== false;
    }
  }

  updateAttrs(attrs: Record<string, any>) {
    if (this.isDestroyed) {
      console.warn("Attempting to update attributes on destroyed node");
      return;
    }

    try {
      const pos = this.getPos();
      if (typeof pos !== "number" || pos < 0) {
        console.warn("Invalid position for updateAttrs:", pos);
        return;
      }

      // Check if position is within document bounds
      const docSize = this.view.state.doc.content.size;
      if (pos >= docSize) {
        console.warn("Position out of document bounds:", pos, "docSize:", docSize);
        return;
      }

      // Verify the node still exists at this position
      try {
        const nodeAtPos = this.view.state.doc.nodeAt(pos);
        if (!nodeAtPos || nodeAtPos.type !== this.node.type) {
          console.warn("Node type mismatch or node not found at position");
          return;
        }
      } catch (e) {
        console.warn("Error checking node at position:", e);
        return;
      }

      const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        ...attrs,
      });

      this.view.dispatch(tr);
    } catch (error) {
      console.warn("Error updating image attributes:", error);
      // Silently fail to prevent breaking the editor
    }
  }

  update(node: Node) {
    if (node.type !== this.node.type) return false;

    this.node = node;
    const { width, align, zoomable, caption } = node.attrs;
    const safeW = Number.isFinite(width) && width > 0 ? width : 320;

    // Update figure styles
    this.dom.className = `pm-figure pm-figure--${align} ${zoomable ? 'zoomable' : ''}`;
    this.dom.setAttribute("data-width", String(safeW));
    this.dom.setAttribute("data-align", String(align));
    this.dom.setAttribute("data-zoomable", String(zoomable));

    // Update controls layout based on new size
    this.updateControlsLayout(this.controls, safeW);

    // Sync controls with new attributes
    this.syncControlsWithAttrs();

    // Update styles based on alignment
    if (align === "center") {
      this.dom.style.maxWidth = `${safeW}px`;
      this.dom.style.margin = "1rem auto";
      this.dom.style.float = "none";
    } else if (align === "left") {
      this.dom.style.maxWidth = `${safeW}px`;
      this.dom.style.float = "left";
      this.dom.style.margin = "0 1rem 1rem 0";
    } else if (align === "right") {
      this.dom.style.maxWidth = `${safeW}px`;
      this.dom.style.float = "right";
      this.dom.style.margin = "0 0 1rem 1rem";
    } else {
      this.dom.style.maxWidth = `${safeW}px`;
      this.dom.style.float = "none";
      this.dom.style.margin = "1rem 0";
    }

    // Update image zoomable class
    this.img.className = zoomable ? "zoomable" : "";

    // Also ensure the figure has the right classes
    this.dom.className = `pm-figure pm-figure--${align} ${zoomable ? 'zoomable' : ''}`;

    // Update caption (with editing enabled)
    if (caption) {
      this.cap.textContent = caption;
      this.cap.className = "pm-caption";
    } else {
      this.cap.textContent = "Click to add caption";
      this.cap.className = "pm-caption pm-caption--empty";
    }

    // Update controls
    const alignSelect = this.controls.querySelector(".pm-align-select") as HTMLSelectElement;
    const zoomCheckbox = this.controls.querySelector(".pm-zoom-checkbox") as HTMLInputElement;

    alignSelect.value = align;
    zoomCheckbox.checked = zoomable;

    // Re-bind control events after update
    this.bindControlEvents();

    return true;
  }

  // Open image edit dialog similar to insert image popup
  openImageEditDialog() {
    const dialog = document.createElement("div");
    dialog.className = "myeditor-overlay";
    dialog.innerHTML = `
      <div class="myeditor-image-dialog">
        <div class="dialog-header">
          <h3>🖼️ Edit Image</h3>
        </div>
        
        <div class="dialog-body">
          <!-- Image Preview Section -->
          <div class="image-preview-container">
            <div class="image-preview">
              <img src="${this.node.attrs.src}" alt="Preview" class="preview-img">
            </div>
          </div>
          
          <!-- Form Fields -->
          <div class="form-group">
            <label>Image URL:</label>
            <input type="url" class="image-url-input" placeholder="https://example.com/image.jpg" value="${this.node.attrs.src}">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Alt Text:</label>
              <input type="text" class="alt-input" placeholder="Describe the image" value="${this.node.attrs.alt || ''}">
            </div>
            <div class="form-group">
              <label>Caption:</label>
              <input type="text" class="caption-input" placeholder="Optional caption" value="${this.node.attrs.caption || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Alignment:</label>
              <select class="align-select">
                <option value="none" ${this.node.attrs.align === 'none' ? 'selected' : ''}>None</option>
                <option value="left" ${this.node.attrs.align === 'left' ? 'selected' : ''}>Left</option>
                <option value="center" ${this.node.attrs.align === 'center' ? 'selected' : ''}>Center</option>
                <option value="right" ${this.node.attrs.align === 'right' ? 'selected' : ''}>Right</option>
              </select>
            </div>
            <div class="form-group">
              <label>Width (px):</label>
              <input type="number" class="width-input" placeholder="320" value="${this.node.attrs.width || 320}" min="50" max="1200">
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" class="zoom-checkbox" ${this.node.attrs.zoomable ? 'checked' : ''}> 
              Zoomable
            </label>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-insert">Update Image</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Handle dialog events
    const cancelBtn = dialog.querySelector(".btn-cancel") as HTMLButtonElement;
    const updateBtn = dialog.querySelector(".btn-insert") as HTMLButtonElement;
    const urlInput = dialog.querySelector(".image-url-input") as HTMLInputElement;
    const widthInput = dialog.querySelector(".width-input") as HTMLInputElement;
    const alignSelect = dialog.querySelector(".align-select") as HTMLSelectElement;
    const captionInput = dialog.querySelector(".caption-input") as HTMLInputElement;
    const altInput = dialog.querySelector(".alt-input") as HTMLInputElement;
    const zoomCheckbox = dialog.querySelector(".zoom-checkbox") as HTMLInputElement;

    const closeDialog = () => {
      dialog.remove();
      this.view.focus();
    };

    cancelBtn.addEventListener("click", closeDialog);

    updateBtn.addEventListener("click", () => {
      const newAttrs = {
        src: urlInput.value.trim() || this.node.attrs.src,
        width: parseInt(widthInput.value) || 320,
        align: alignSelect.value,
        caption: captionInput.value.trim(),
        alt: altInput.value.trim(),
        zoomable: zoomCheckbox.checked
      };

      this.updateAttrs(newAttrs);
      closeDialog();
    });

    // Close on backdrop click (clicking outside dialog)
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        closeDialog();
      }
    });

    // Escape key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDialog();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);

    // Focus first input
    urlInput.focus();
    urlInput.select();
  }

  destroy() {
    // Mark as destroyed to prevent further updates
    this.isDestroyed = true;

    if (this.onMove) window.removeEventListener("mousemove", this.onMove);
    if (this.onUp) window.removeEventListener("mouseup", this.onUp);
  }

  selectNode() {
    this.dom.classList.add("ProseMirror-selectednode");
    this.controls.style.display = "block";
  }

  deselectNode() {
    this.dom.classList.remove("ProseMirror-selectednode");
    this.controls.style.display = "none";
  }
}
import { NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";

/**
 * ==========================================
 * CLEAN IMAGE NODE VIEW SYSTEM
 * ==========================================
 * 
 * Structure:
 * .myeditor-image-wrapper
 *   .myeditor-image-container
 *     .myeditor-image-content
 *       img
 *       .myeditor-image-overlay
 *         .myeditor-image-controls
 *         .myeditor-resize-handle
 *     .myeditor-image-caption
 * 
 * Features:
 * - Clean div-based structure
 * - Easy CSS customization  
 * - Proper alignment handling
 * - Resize functionality
 * - Controls overlay
 * - Caption editing
 */

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

    // ==========================================
    // CREATE CLEAN DIV-BASED STRUCTURE
    // ==========================================
    
    // Main wrapper - Controls overall positioning
    const wrapper = document.createElement("div");
    wrapper.className = `myeditor-image-wrapper myeditor-image-wrapper--${align}`;
    wrapper.setAttribute("data-image-align", align);
    wrapper.setAttribute("data-image-width", String(safeW));
    wrapper.setAttribute("data-zoomable", String(zoomable));
    wrapper.style.maxWidth = `${safeW}px`;

    // Container - Holds image content
    const container = document.createElement("div");
    container.className = "myeditor-image-container";

    // Image content wrapper
    const content = document.createElement("div");
    content.className = "myeditor-image-content";

    // Create image element
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt || "";
    if (title) img.title = title;
    img.loading = "lazy";
    img.draggable = false;
    img.className = `myeditor-image ${zoomable ? 'myeditor-image--zoomable' : ''}`;

    // Create overlay for controls and handle
    const overlay = document.createElement("div");
    overlay.className = "myeditor-image-overlay";

    // Create controls panel
    const controls = document.createElement("div");
    controls.className = "myeditor-image-controls";
    controls.innerHTML = this.createControlsHTML();

    // Create resize handle
    const handle = document.createElement("div");
    handle.className = "myeditor-resize-handle";
    handle.innerHTML = "⟲";
    handle.setAttribute("title", "Drag to resize");

    // Create caption
    const caption_el = document.createElement("div");
    caption_el.className = `myeditor-image-caption ${!caption ? 'myeditor-image-caption--empty' : ''}`;
    caption_el.contentEditable = "plaintext-only";
    caption_el.textContent = caption || "Click to add caption";
    caption_el.setAttribute("data-placeholder", "Click to add caption");

    // ==========================================
    // ASSEMBLE STRUCTURE
    // ==========================================
    
    // Build hierarchy: wrapper > container > content > [img + overlay]
    overlay.appendChild(controls);
    overlay.appendChild(handle);
    
    content.appendChild(img);
    content.appendChild(overlay);
    
    container.appendChild(content);
    container.appendChild(caption_el);
    
    wrapper.appendChild(container);

    // Set references for methods
    this.dom = wrapper;
    this.img = img;
    this.cap = caption_el;
    this.handle = handle;
    this.controls = controls;

    // Apply alignment styles
    this.updateAlignmentStyles();
    
    // Bind events
    this.bindEvents();
  }

  // ==========================================
  // CREATE CONTROLS HTML
  // ==========================================
  private createControlsHTML(): string {
    const { align, zoomable } = this.node.attrs;
    return `
      <div class="myeditor-image-controls-row">
        <div class="myeditor-image-control-group">
          <label>Align:</label>
          <select class="myeditor-align-select">
            <option value="none" ${align === 'none' ? 'selected' : ''}>None</option>
            <option value="left" ${align === 'left' ? 'selected' : ''}>Left</option>
            <option value="center" ${align === 'center' ? 'selected' : ''}>Center</option>
            <option value="right" ${align === 'right' ? 'selected' : ''}>Right</option>
          </select>
        </div>
        
        <div class="myeditor-image-control-group">
          <label class="myeditor-zoom-label">
            <input type="checkbox" class="myeditor-zoom-checkbox" ${zoomable ? 'checked' : ''}> 
            Zoom
          </label>
        </div>
        
        <div class="myeditor-image-control-group myeditor-image-actions">
          <button type="button" class="myeditor-edit-btn" title="Edit image">✏️</button>
          <button type="button" class="myeditor-delete-btn" title="Delete image">🗑️</button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // UPDATE ALIGNMENT STYLES  
  // ==========================================
  private updateAlignmentStyles() {
    const { align } = this.node.attrs;
    const safeW = Number.isFinite(this.node.attrs.width) && this.node.attrs.width > 0 ? this.node.attrs.width : 320;
    
    // Remove old alignment classes
    this.dom.className = this.dom.className.replace(/myeditor-image-wrapper--\w+/g, '');
    
    // Add new alignment class
    this.dom.classList.add(`myeditor-image-wrapper--${align}`);
    this.dom.setAttribute("data-image-align", align);
    this.dom.style.maxWidth = `${safeW}px`;
  }

  // ==========================================
  // BIND ALL EVENTS
  // ==========================================
  bindEvents() {
    this.bindResizeEvents();
    this.bindCaptionEvents();
    this.bindControlEvents();
    this.bindSelectionEvents();
  }

  // ==========================================
  // RESIZE FUNCTIONALITY
  // ==========================================
  private bindResizeEvents() {
    let startX: number, startY: number, startW: number, startH: number;
    let isDragging = false;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - startX;
      const nextW = clamp(startW + deltaX, 100, 1200);
      const aspectRatio = startH / startW;
      const nextH = Math.round(nextW * aspectRatio);

      this.dom.style.maxWidth = `${nextW}px`;
      this.updateAttrs({ width: nextW, height: nextH });
    };

    const onUp = () => {
      isDragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    this.handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = Number(this.node.attrs.width) || 320;
      startH = Number(this.node.attrs.height) || 240;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });

    this.handle.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isDragging = true;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startW = Number(this.node.attrs.width) || 320;
      startH = Number(this.node.attrs.height) || 240;

      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
    });

    this.onMove = onMove;
    this.onUp = onUp;
  }

  // ==========================================
  // CAPTION EDITING
  // ==========================================
  private bindCaptionEvents() {
    this.cap.addEventListener("click", (e) => {
      e.stopPropagation();
      this.cap.focus();
      
      // Clear placeholder if empty
      if (this.cap.classList.contains('myeditor-image-caption--empty')) {
        this.cap.textContent = '';
        this.cap.classList.remove('myeditor-image-caption--empty');
      }
    });

    this.cap.addEventListener("blur", () => {
      const newCaption = this.cap.textContent?.trim() || '';
      
      if (!newCaption) {
        this.cap.textContent = 'Click to add caption';
        this.cap.classList.add('myeditor-image-caption--empty');
      } else {
        this.cap.classList.remove('myeditor-image-caption--empty');
      }
      
      this.updateAttrs({ caption: newCaption });
    });

    this.cap.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.cap.blur();
      }
    });
  }

  // ==========================================
  // CONTROL EVENTS (ALIGN, ZOOM, EDIT, DELETE)
  // ==========================================
  private bindControlEvents() {
    const alignSelect = this.controls.querySelector(".myeditor-align-select") as HTMLSelectElement;
    const zoomCheckbox = this.controls.querySelector(".myeditor-zoom-checkbox") as HTMLInputElement;
    const editBtn = this.controls.querySelector(".myeditor-edit-btn") as HTMLButtonElement;
    const deleteBtn = this.controls.querySelector(".myeditor-delete-btn") as HTMLButtonElement;

    // Align dropdown
    if (alignSelect) {
      alignSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        this.updateAttrs({ align: alignSelect.value });
      });
    }

    // Zoom checkbox
    if (zoomCheckbox) {
      zoomCheckbox.addEventListener("change", (e) => {
        e.stopPropagation();
        this.updateAttrs({ zoomable: zoomCheckbox.checked });
      });
    }

    // Edit button
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openEditDialog();
      });
    }

    // Delete button
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
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

  // ==========================================
  // SELECTION EVENTS
  // ==========================================
  private bindSelectionEvents() {
    this.dom.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectNode();
    });

    // Remove selection when clicking elsewhere
    document.addEventListener("click", (e) => {
      if (!this.dom.contains(e.target as HTMLElement)) {
        this.deselectNode();
      }
    });
  }

  // ==========================================
  // NODE SELECTION
  // ==========================================
  selectNode() {
    this.dom.classList.add("selected");
    
    // Remove selection from other images
    document.querySelectorAll(".myeditor-image-wrapper.selected").forEach(wrapper => {
      if (wrapper !== this.dom) {
        wrapper.classList.remove("selected");
      }
    });
  }

  deselectNode() {
    this.dom.classList.remove("selected");
  }

  // ==========================================
  // EDIT DIALOG
  // ==========================================
  private openEditDialog() {
    const dialog = document.createElement("div");
    dialog.className = "myeditor-overlay";
    dialog.innerHTML = `
      <div class="myeditor-image-dialog">
        <div class="dialog-header">
          <h3>🖼️ Edit Image</h3>
        </div>
        
        <div class="dialog-body">
          <div class="image-preview-container">
            <div class="image-preview">
              <img src="${this.node.attrs.src}" alt="Preview" class="preview-img">
            </div>
          </div>
          
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
    
    // Close on backdrop click
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

  // ==========================================
  // UPDATE ATTRIBUTES
  // ==========================================
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
      
      const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        ...attrs,
      });
      
      this.view.dispatch(tr);
    } catch (error) {
      console.warn("Error updating image attributes:", error);
    }
  }

  // ==========================================
  // UPDATE METHOD (CALLED BY PROSEMIRROR)
  // ==========================================
  update(node: Node) {
    if (node.type !== this.node.type) return false;
    
    this.node = node;
    const { width, align, zoomable, caption, src, alt } = node.attrs;
    const safeW = Number.isFinite(width) && width > 0 ? width : 320;

    // Update DOM structure
    this.dom.setAttribute("data-image-align", align);
    this.dom.setAttribute("data-image-width", String(safeW));
    this.dom.setAttribute("data-zoomable", String(zoomable));
    
    // Update image
    this.img.src = src;
    this.img.alt = alt || "";
    this.img.className = `myeditor-image ${zoomable ? 'myeditor-image--zoomable' : ''}`;
    
    // Update caption
    if (caption) {
      this.cap.textContent = caption;
      this.cap.classList.remove('myeditor-image-caption--empty');
    } else {
      this.cap.textContent = "Click to add caption";
      this.cap.classList.add('myeditor-image-caption--empty');
    }
    
    // Update controls
    this.controls.innerHTML = this.createControlsHTML();
    this.bindControlEvents(); // Re-bind after HTML update
    
    // Update alignment styles
    this.updateAlignmentStyles();

    return true;
  }

  // ==========================================
  // DESTROY (CLEANUP)
  // ==========================================
  destroy() {
    this.isDestroyed = true;
    
    if (this.onMove) window.removeEventListener("mousemove", this.onMove);
    if (this.onUp) window.removeEventListener("mouseup", this.onUp);
  }
}
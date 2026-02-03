import { NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";

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
  private onMove?: (e: MouseEvent) => void;
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

    // Create caption
    const cap = document.createElement("figcaption");
    cap.className = caption ? "pm-caption" : "pm-caption pm-caption--empty";
    cap.contentEditable = "true";
    cap.textContent = caption || "Click to add caption";
    
    // Create resize handle
    const handle = document.createElement("div");
    handle.className = "pm-resize-handle";
    handle.innerHTML = "⋮⋮";
    handle.setAttribute("title", "Drag to resize");

    // Create controls for alignment and zoom
    const controls = document.createElement("div");
    controls.className = "pm-image-controls";
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
        <button class="pm-delete-btn" title="Delete image">🗑️</button>
      </div>
    `;

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
  }

  bindEvents() {
    // Resize functionality
    this.bindResize();
    
    // Caption editing
    this.cap.addEventListener("blur", () => {
      const newCaption = this.cap.textContent?.trim() || "";
      this.updateAttrs({ caption: newCaption });
      
      if (!newCaption) {
        this.cap.textContent = "Click to add caption";
        this.cap.className = "pm-caption pm-caption--empty";
      } else {
        this.cap.className = "pm-caption";
      }
    });

    this.cap.addEventListener("focus", () => {
      if (this.cap.className.includes("pm-caption--empty")) {
        this.cap.textContent = "";
        this.cap.className = "pm-caption";
      }
    });

    this.cap.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.cap.blur();
      }
    });

    // Controls - Initialize and sync with current node attributes
    this.syncControlsWithAttrs();
    
    const alignSelect = this.controls.querySelector(".pm-align-select") as HTMLSelectElement;
    const zoomCheckbox = this.controls.querySelector(".pm-zoom-checkbox") as HTMLInputElement;
    const deleteBtn = this.controls.querySelector(".pm-delete-btn") as HTMLButtonElement;

    if (alignSelect) {
      // Set initial value
      alignSelect.value = this.node.attrs.align || 'center';
      
      alignSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Align changed to:', alignSelect.value);
        this.updateAttrs({ align: alignSelect.value });
      });
      
      // Ensure dropdown is clickable
      alignSelect.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
    }

    if (zoomCheckbox) {
      // Set initial value
      zoomCheckbox.checked = this.node.attrs.zoomable !== false;
      
      zoomCheckbox.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Zoom changed to:', zoomCheckbox.checked);
        this.updateAttrs({ zoomable: zoomCheckbox.checked });
      });
      
      // Make label clickable
      const label = zoomCheckbox.closest('label');
      if (label) {
        label.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    }

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

    this.onMove = (e: MouseEvent) => {
      if (!this.isResizing || !isDragging) return;
      
      e.preventDefault();
      const dx = e.clientX - startX;
      const nextW = clamp(startW + dx, 100, 1000);
      
      // Update visual immediately for smooth feedback
      this.dom.style.maxWidth = `${nextW}px`;
      
      // Debounce actual state update
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = window.setTimeout(() => {
        this.updateAttrs({ width: nextW });
      }, 50);
    };

    this.onUp = () => {
      isDragging = false;
      this.isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      
      if (this.onMove) window.removeEventListener("mousemove", this.onMove);
      if (this.onUp) window.removeEventListener("mouseup", this.onUp);
      
      this.handle.style.cursor = "col-resize";
      
      // Clear any pending resize updates
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = undefined;
      }
    };

    this.handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      this.isResizing = true;
      startX = e.clientX;
      startW = Number(this.node.attrs.width) || 320;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      if (this.onMove) window.addEventListener("mousemove", this.onMove);
      if (this.onUp) window.addEventListener("mouseup", this.onUp);
    });

    // Add resize cursor indicator
    this.handle.style.cursor = "col-resize";
  }

  private resizeTimeout: number | undefined;

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
    const pos = this.getPos();
    if (typeof pos !== "number") return;
    
    const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      ...attrs,
    });
    this.view.dispatch(tr);
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

    // Update caption
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

    return true;
  }

  destroy() {
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
import { Node as ProseMirrorNode } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";
import { EmbedAttrs } from "../../schema/nodes/embed";
import { createEmbedDialog } from "../../commands/embed";

/**
 * Enhanced EmbedNodeView with improved security and compatibility
 * 
 * For proper functionality in different projects, ensure your HTML includes:
 * 
 * Content Security Policy (CSP):
 * <meta http-equiv="Content-Security-Policy" content="
 *   frame-src 'self' https://*.youtube.com https://*.vimeo.com https://player.vimeo.com https://twitframe.com;
 *   script-src 'self' 'unsafe-inline';
 * ">
 * 
 * Or configure your server headers:
 * frame-ancestors: 'self' https://*.youtube.com https://*.vimeo.com
 */

export class EmbedNodeView implements NodeView {
  dom: HTMLElement;
  node: ProseMirrorNode;
  view: EditorView;
  getPos: () => number | undefined;
  controls: HTMLElement;
  iframe: HTMLIFrameElement;

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // Create main container
    this.dom = document.createElement("div");
    this.dom.className = `pm-embed-container pm-embed--${node.attrs.type} pm-embed--${node.attrs.align}`;
    this.dom.style.position = "relative";
    this.dom.style.margin = "1rem 0";

    // Create iframe
    this.iframe = document.createElement("iframe");
    this.iframe.src = this.getEmbedUrl(node.attrs.src, node.attrs.type);
    this.iframe.width = String(node.attrs.width || 560);
    this.iframe.height = String(node.attrs.height || 315);
    this.iframe.title = node.attrs.title || "Embedded content";
    this.iframe.frameBorder = "0";
    this.iframe.allowFullscreen = true;
    // Enhanced security and compatibility attributes
    this.iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    this.iframe.setAttribute("allowfullscreen", "true");
    this.iframe.setAttribute("webkitallowfullscreen", "true");
    this.iframe.setAttribute("mozallowfullscreen", "true");
    this.iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-presentation allow-forms");
    this.iframe.setAttribute("loading", "lazy");
    this.iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    this.iframe.style.border = "none";
    this.iframe.style.borderRadius = "8px";
    this.iframe.style.width = "100%";
    this.iframe.style.height = "auto";
    this.iframe.style.aspectRatio = `${node.attrs.width || 560} / ${node.attrs.height || 315}`;
    
    // Set container max-width to control actual size
    this.dom.style.maxWidth = `${node.attrs.width || 560}px`;

    // Create controls
    this.controls = document.createElement("div");
    this.controls.className = "pm-embed-controls";
    this.controls.style.display = "none";
    this.controls.innerHTML = `
      <div class="pm-controls-row">
        <label>Size:</label>
        <select class="pm-size-select">
          <option value="small">Small (400×225)</option>
          <option value="medium" selected>Medium (560×315)</option>
          <option value="large">Large (800×450)</option>
          <option value="full">Full Width</option>
        </select>
        <label>Align:</label>
        <select class="pm-align-select">
          <option value="none">None</option>
          <option value="left">Left</option>
          <option value="center" selected>Center</option>
          <option value="right">Right</option>
        </select>
        <button class="pm-edit-btn" title="Edit embed">✏️</button>
        <button class="pm-delete-btn" title="Delete embed">🗑️</button>
      </div>
    `;

    // Apply alignment styles
    this.updateAlignment();

    // Add error handling for iframe loading
    this.iframe.addEventListener('error', () => {
      console.warn('Failed to load embed:', this.node.attrs.src);
      this.showErrorState();
    });
    
    this.iframe.addEventListener('load', () => {
      console.log('Embed loaded successfully:', this.node.attrs.src);
    });

    // Add iframe and controls to DOM
    this.dom.appendChild(this.iframe);
    this.dom.appendChild(this.controls);

    // Setup event listeners
    this.setupEventListeners();
  }

  private showErrorState() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'pm-embed-error';
    errorDiv.innerHTML = `
      <div style="
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 40px;
        text-align: center;
        color: #6b7280;
        aspect-ratio: ${this.node.attrs.width || 560} / ${this.node.attrs.height || 315};
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <div style="font-weight: 600; margin-bottom: 8px;">Content unavailable</div>
        <div style="font-size: 14px; margin-bottom: 8px;">The embedded content could not be loaded.</div>
        <div style="font-size: 12px; opacity: 0.7; word-break: break-all;">
          ${this.node.attrs.src}
        </div>
      </div>
    `;
    
    // Replace iframe with error message
    if (this.iframe.parentNode) {
      this.iframe.parentNode.replaceChild(errorDiv, this.iframe);
    }
  }

  private getEmbedUrl(url: string, type: EmbedAttrs['type']): string {
    switch (type) {
      case 'youtube':
        return this.convertYouTubeUrl(url);
      case 'vimeo':
        return this.convertVimeoUrl(url);
      case 'twitter':
        return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
      case 'instagram':
        return url.endsWith('/') ? `${url}embed/` : `${url}/embed/`;
      default:
        return url;
    }
  }

  private convertYouTubeUrl(url: string): string {
    // Multiple YouTube URL patterns
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        // Add enhanced YouTube embed parameters for better compatibility
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&controls=1&origin=${window.location.origin}&enablejsapi=1&widgetid=1`;
      }
    }
    
    // If it's already an embed URL, ensure it has proper parameters
    if (url.includes('youtube.com/embed/')) {
      const baseUrl = url.split('?')[0];
      const videoId = baseUrl.split('/').pop();
      return `${baseUrl}?autoplay=0&mute=0&controls=1&origin=${window.location.origin}&enablejsapi=1&widgetid=1`;
    }
    
    return url;
  }

  private convertVimeoUrl(url: string): string {
    const patterns = [
      /vimeo\.com\/([0-9]+)/,
      /player\.vimeo\.com\/video\/([0-9]+)/,
      /vimeo\.com\/video\/([0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        // Add Vimeo embed parameters for better compatibility
        return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&dnt=1`;
      }
    }
    
    return url;
  }

  private setupEventListeners() {
    // Controls
    const sizeSelect = this.controls.querySelector(".pm-size-select") as HTMLSelectElement;
    const alignSelect = this.controls.querySelector(".pm-align-select") as HTMLSelectElement;
    const editBtn = this.controls.querySelector(".pm-edit-btn") as HTMLButtonElement;
    const deleteBtn = this.controls.querySelector(".pm-delete-btn") as HTMLButtonElement;

    // Sync controls with current attributes
    this.syncControlsWithAttrs();

    if (sizeSelect) {
      sizeSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const size = sizeSelect.value;
        let width: number, height: number;
        
        switch (size) {
          case 'small':
            width = 400;
            height = 225;
            break;
          case 'large':
            width = 800;
            height = 450;
            break;
          case 'full':
            width = 960;
            height = 540;
            break;
          default: // medium
            width = 560;
            height = 315;
        }
        
        console.log('Size changed to:', size, width, height);
        this.updateAttrs({ width, height });
      });
      
      // Make dropdown clickable
      sizeSelect.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
    }

    if (alignSelect) {
      alignSelect.value = this.node.attrs.align || 'center';
      alignSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Align changed to:', alignSelect.value);
        this.updateAttrs({ align: alignSelect.value });
      });
      
      // Make dropdown clickable
      alignSelect.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const dialog = createEmbedDialog(this.view);
        document.body.appendChild(dialog);
        
        // Pre-fill current values after dialog is in DOM
        setTimeout(() => {
          const urlInput = dialog.querySelector(".embed-url-input") as HTMLInputElement;
          const widthInput = dialog.querySelector(".width-input") as HTMLInputElement;
          const heightInput = dialog.querySelector(".height-input") as HTMLInputElement;
          const alignSelectDialog = dialog.querySelector(".align-select") as HTMLSelectElement;
          const titleInput = dialog.querySelector(".title-input") as HTMLInputElement;
          const insertBtn = dialog.querySelector(".btn-insert") as HTMLButtonElement;
          
          if (urlInput) {
            urlInput.value = this.node.attrs.src;
            // Trigger input event to show preview and enable button
            urlInput.dispatchEvent(new Event('input'));
          }
          if (widthInput) widthInput.value = String(this.node.attrs.width || 560);
          if (heightInput) heightInput.value = String(this.node.attrs.height || 315);
          if (alignSelectDialog) alignSelectDialog.value = this.node.attrs.align || 'center';
          if (titleInput) titleInput.value = this.node.attrs.title || "";
          
          // Store reference to current embed for updating
          const currentPos = this.getPos();
          const currentNode = this.node;
          
          // Override insert button to update instead of insert
          if (insertBtn) {
            const newInsertHandler = () => {
              const newAttrs = {
                src: urlInput?.value?.trim() || currentNode.attrs.src,
                type: currentNode.attrs.type, // Keep same type
                width: parseInt(widthInput?.value || '560'),
                height: parseInt(heightInput?.value || '315'),
                title: titleInput?.value?.trim() || '',
                align: alignSelectDialog?.value || 'center'
              };
              
              if (typeof currentPos === "number") {
                const tr = this.view.state.tr.setNodeMarkup(currentPos, undefined, newAttrs);
                this.view.dispatch(tr);
              }
              
              // Close dialog
              dialog.remove();
              this.view.focus();
            };
            
            // Remove old listeners and add new one
            const newInsertBtn = insertBtn.cloneNode(true);
            insertBtn.parentNode?.replaceChild(newInsertBtn, insertBtn);
            newInsertBtn.addEventListener('click', newInsertHandler);
          }
        }, 100);
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Delete this embed?")) {
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
      const related = e.relatedTarget as HTMLElement;
      if (!this.controls.contains(related) && !this.dom.classList.contains('ProseMirror-selectednode')) {
        setTimeout(() => {
          if (!this.dom.matches(':hover')) {
            this.controls.style.display = "none";
          }
        }, 100);
      }
    });

    // Prevent editor focus loss
    this.controls.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });

    this.controls.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  private syncControlsWithAttrs() {
    const sizeSelect = this.controls.querySelector(".pm-size-select") as HTMLSelectElement;
    const alignSelect = this.controls.querySelector(".pm-align-select") as HTMLSelectElement;
    
    if (alignSelect) {
      alignSelect.value = this.node.attrs.align || 'center';
    }
    
    if (sizeSelect) {
      const width = this.node.attrs.width || 560;
      if (width <= 400) {
        sizeSelect.value = 'small';
      } else if (width >= 800) {
        sizeSelect.value = width >= 960 ? 'full' : 'large';
      } else {
        sizeSelect.value = 'medium';
      }
    }
  }

  private updateAttrs(attrs: Record<string, any>) {
    const pos = this.getPos();
    if (typeof pos !== "number") return;
    
    const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
      ...this.node.attrs,
      ...attrs,
    });
    this.view.dispatch(tr);
  }

  private updateAlignment() {
    const align = this.node.attrs.align || 'center';
    const width = this.node.attrs.width || 560;
    
    this.dom.className = `pm-embed-container pm-embed--${this.node.attrs.type} pm-embed--${align}`;
    this.dom.style.maxWidth = `${width}px`;
    
    if (align === "center") {
      this.dom.style.textAlign = "center";
      this.dom.style.margin = "1rem auto";
      this.dom.style.float = "none";
    } else if (align === "left") {
      this.dom.style.float = "left";
      this.dom.style.margin = "0 1rem 1rem 0";
      this.dom.style.textAlign = "left";
    } else if (align === "right") {
      this.dom.style.float = "right";
      this.dom.style.margin = "0 0 1rem 1rem";
      this.dom.style.textAlign = "right";
    } else {
      this.dom.style.float = "none";
      this.dom.style.margin = "1rem 0";
      this.dom.style.textAlign = "left";
    }
  }

  update(node: ProseMirrorNode) {
    if (node.type !== this.node.type) return false;
    
    this.node = node;
    const { src, type, width, height, title, align } = node.attrs;

    // Update iframe
    this.iframe.src = this.getEmbedUrl(src, type);
    this.iframe.width = String(width || 560);
    this.iframe.height = String(height || 315);
    this.iframe.title = title || "Embedded content";
    this.iframe.style.aspectRatio = `${width || 560} / ${height || 315}`;
    
    // Update container max-width for size control
    this.dom.style.maxWidth = `${width || 560}px`;

    // Update alignment
    this.updateAlignment();

    // Sync controls
    this.syncControlsWithAttrs();

    return true;
  }

  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
    this.controls.style.display = "block";
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
    if (!this.dom.matches(':hover')) {
      this.controls.style.display = "none";
    }
  }

  destroy() {
    // Cleanup if needed
  }
}
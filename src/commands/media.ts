import type { EditorState, Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

// Enhanced image insert with new format
export function insertEnhancedImage(
  src: string,
  alt?: string,
  title?: string,
  align: "none" | "left" | "center" | "right" = "center",
  width: number = 320,
  caption?: string,
  zoomable?: boolean
) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const node = state.schema.nodes.image?.create({
      src,
      alt: alt || "",
      title,
      align,
      width,
      caption: caption || "",
      zoomable: zoomable || false,
    });

    if (!node) return false;

    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(node);
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

// Legacy image insert for backward compatibility
export function insertImage(
  src: string, 
  alt?: string, 
  title?: string, 
  align = "center",
  width?: string,
  height?: string,
  maxWidth = "100%",
  zoom = false
) {
  return insertEnhancedImage(
    src,
    alt,
    title,
    align as any,
    320,
    "",
    zoom
  );
}

// Insert image with figure wrapper (like Wikipedia)
export function insertFigure(
  src: string, 
  alt?: string, 
  caption?: string, 
  align = "center",
  width?: string,
  height?: string,
  maxWidth = "100%",
  zoom = false
) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    if (!dispatch) return false;
    
    const figureType = state.schema.nodes.figure;
    const imageType = state.schema.nodes.image;
    const figcaptionType = state.schema.nodes.figcaption;
    
    if (!figureType || !imageType) return false;
    
    const imageNode = imageType.create({
      src,
      alt: alt || "",
      align,
      width,
      height,
      maxWidth,
      zoom,
    });
    
    const children = [imageNode];
    
    // Add caption if provided
    if (caption && figcaptionType) {
      const captionNode = figcaptionType.create({}, state.schema.text(caption));
      children.push(captionNode);
    }
    
    const figureNode = figureType.create({ align }, children);
    
    const { from } = state.selection;
    const tr = state.tr.replaceSelectionWith(figureNode);
    dispatch(tr);
    return true;
  };
}

// Insert code block
export function insertCodeBlock(language?: string, content = "") {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    if (!dispatch) return false;
    
    const codeBlockType = state.schema.nodes.code_block;
    if (!codeBlockType) return false;
    
    const node = codeBlockType.create(
      { language },
      content ? state.schema.text(content) : undefined
    );
    
    const { from } = state.selection;
    const tr = state.tr.replaceSelectionWith(node);
    dispatch(tr);
    return true;
  };
}

// Handle file upload with preview
export async function handleImageUpload(file: File): Promise<string> {
  // For demo purposes, create a data URL
  // In production, you'd upload to your server
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Create image upload dialog
export function createImageUploadDialog(view: EditorView): HTMLElement {
  const dialog = document.createElement('div');
  dialog.className = 'myeditor-image-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3>Insert Image</h3>
      
      <div class="form-group">
        <label>Upload Image:</label>
        <input type="file" accept="image/*" class="file-input">
      </div>
      
      <div class="form-group">
        <label>Or Image URL:</label>
        <input type="url" placeholder="https://example.com/image.jpg" class="url-input">
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Alt Text:</label>
          <input type="text" placeholder="Description of the image" class="alt-input">
        </div>
        <div class="form-group">
          <label>Caption:</label>
          <input type="text" placeholder="Optional caption" class="caption-input">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Position:</label>
          <select class="align-select">
            <option value="center">Center</option>
            <option value="left">Left Aligned</option>
            <option value="right">Right Aligned</option>
            <option value="float-left">Float Left (text wraps)</option>
            <option value="float-right">Float Right (text wraps)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Max Width:</label>
          <select class="width-select">
            <option value="100%">Full Width (100%)</option>
            <option value="80%">Large (80%)</option>
            <option value="60%">Medium (60%)</option>
            <option value="40%">Small (40%)</option>
            <option value="300px">Fixed 300px</option>
            <option value="500px">Fixed 500px</option>
          </select>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>
            <input type="checkbox" class="zoom-checkbox"> 
            Enable click-to-zoom
          </label>
        </div>
        <div class="form-group preview-group" style="display: none;">
          <img class="image-preview" alt="Preview" />
        </div>
      </div>
      
      <div class="dialog-actions">
        <button type="button" class="btn-cancel">Cancel</button>
        <button type="button" class="btn-insert">Insert Image</button>
      </div>
    </div>
  `;
  
  const fileInput = dialog.querySelector('.file-input') as HTMLInputElement;
  const urlInput = dialog.querySelector('.url-input') as HTMLInputElement;
  const altInput = dialog.querySelector('.alt-input') as HTMLInputElement;
  const captionInput = dialog.querySelector('.caption-input') as HTMLInputElement;
  const alignSelect = dialog.querySelector('.align-select') as HTMLSelectElement;
  const widthSelect = dialog.querySelector('.width-select') as HTMLSelectElement;
  const zoomCheckbox = dialog.querySelector('.zoom-checkbox') as HTMLInputElement;
  const preview = dialog.querySelector('.image-preview') as HTMLImageElement;
  const previewGroup = dialog.querySelector('.preview-group') as HTMLElement;
  const cancelBtn = dialog.querySelector('.btn-cancel') as HTMLButtonElement;
  const insertBtn = dialog.querySelector('.btn-insert') as HTMLButtonElement;
  
  // Preview functionality
  const showPreview = (src: string) => {
    if (src) {
      preview.src = src;
      previewGroup.style.display = 'block';
    } else {
      previewGroup.style.display = 'none';
    }
  };
  
  fileInput.addEventListener('change', async () => {
    if (fileInput.files?.[0]) {
      try {
        const dataUrl = await handleImageUpload(fileInput.files[0]);
        urlInput.value = dataUrl;
        showPreview(dataUrl);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Upload failed');
      }
    }
  });
  
  urlInput.addEventListener('input', () => {
    showPreview(urlInput.value);
  });
  
  const cleanup = () => {
    dialog.remove();
    view.focus();
  };
  
  cancelBtn.addEventListener('click', cleanup);
  
  insertBtn.addEventListener('click', () => {
    const src = urlInput.value.trim();
    const alt = altInput.value.trim();
    const caption = captionInput.value.trim();
    const align = alignSelect.value;
    const maxWidth = widthSelect.value;
    const zoom = zoomCheckbox.checked;
    
    if (!src) {
      alert('Please provide an image URL or upload a file');
      return;
    }
    
    // Use figure if caption is provided, otherwise just insert image
    const command = caption 
      ? insertFigure(src, alt, caption, align, undefined, undefined, maxWidth, zoom)
      : insertImage(src, alt, undefined, align, undefined, undefined, maxWidth, zoom);
      
    if (command(view.state, view.dispatch)) {
      cleanup();
    }
  });
  
  return dialog;
}

// Enhanced image upload with file handling
async function uploadEnhancedImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("Image must be smaller than 10MB"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function createEnhancedImageDialog(view: EditorView): HTMLElement {
  // Create overlay first
  const overlay = document.createElement("div");
  overlay.className = "myeditor-overlay";
  
  const dialog = document.createElement("div");
  dialog.className = "myeditor-image-dialog myeditor-enhanced-dialog";
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>🖼️ Insert Image</h3>
      <button class="dialog-close" type="button" aria-label="Close">✕</button>
    </div>
    
    <div class="dialog-body">
      <div class="dialog-tabs">
        <button class="tab-btn active" data-tab="upload">📁 Upload</button>
        <button class="tab-btn" data-tab="url">🔗 URL</button>
      </div>
      
      <!-- Upload Tab -->
      <div class="tab-content active" id="upload-tab">
        <div class="upload-area">
          <input type="file" class="file-input" accept="image/*" style="display: none;">
          <div class="upload-dropzone">
            <div class="upload-icon">📷</div>
            <p>Drop image here or <button type="button" class="upload-trigger">browse files</button></p>
            <small>Supports JPG, PNG, GIF, WebP (max 10MB)</small>
          </div>
        </div>
      </div>
      
      <!-- URL Tab -->
      <div class="tab-content" id="url-tab">
        <div class="form-group">
          <label>Image URL:</label>
          <input type="url" class="url-input" placeholder="https://example.com/image.jpg">
        </div>
      </div>
      
      <!-- Image Settings -->
      <div class="image-settings">
        <div class="form-row">
          <div class="form-group">
            <label>Alt Text:</label>
            <input type="text" class="alt-input" placeholder="Describe the image">
          </div>
          <div class="form-group">
            <label>Caption:</label>
            <input type="text" class="caption-input" placeholder="Optional caption">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Alignment:</label>
            <select class="align-select">
              <option value="none">None</option>
              <option value="left">Float Left</option>
              <option value="center" selected>Center</option>
              <option value="right">Float Right</option>
            </select>
          </div>
          <div class="form-group">
            <label>Width (px):</label>
            <input type="number" class="width-input" value="320" min="100" max="1000" step="10">
          </div>
        </div>
        
        <div class="form-row">
          <label class="checkbox-label">
            <input type="checkbox" class="zoom-checkbox"> 
            Enable click to zoom
          </label>
        </div>
      </div>
      
      <!-- Preview -->
      <div class="image-preview-container" style="display: none;">
        <label>Preview:</label>
        <div class="image-preview">
          <img class="preview-img" alt="Preview">
        </div>
      </div>
    </div>
    
    <div class="dialog-actions">
      <button type="button" class="btn-cancel">Cancel</button>
      <button type="button" class="btn-insert" disabled>Insert Image</button>
    </div>
  `;

  // Get elements
  const fileInput = dialog.querySelector(".file-input") as HTMLInputElement;
  const urlInput = dialog.querySelector(".url-input") as HTMLInputElement;
  const altInput = dialog.querySelector(".alt-input") as HTMLInputElement;
  const captionInput = dialog.querySelector(".caption-input") as HTMLInputElement;
  const alignSelect = dialog.querySelector(".align-select") as HTMLSelectElement;
  const widthInput = dialog.querySelector(".width-input") as HTMLInputElement;
  const zoomCheckbox = dialog.querySelector(".zoom-checkbox") as HTMLInputElement;
  const uploadTrigger = dialog.querySelector(".upload-trigger") as HTMLButtonElement;
  const dropzone = dialog.querySelector(".upload-dropzone") as HTMLElement;
  const previewContainer = dialog.querySelector(".image-preview-container") as HTMLElement;
  const previewImg = dialog.querySelector(".preview-img") as HTMLImageElement;
  const insertBtn = dialog.querySelector(".btn-insert") as HTMLButtonElement;
  const cancelBtn = dialog.querySelector(".btn-cancel") as HTMLButtonElement;
  const closeBtn = dialog.querySelector(".dialog-close") as HTMLButtonElement;
  
  // Tab switching
  const tabBtns = dialog.querySelectorAll(".tab-btn");
  const tabContents = dialog.querySelectorAll(".tab-content");
  
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      
      btn.classList.add("active");
      dialog.querySelector(`#${tab}-tab`)?.classList.add("active");
      
      checkValidation();
    });
  });

  let currentImageSrc = "";

  // File upload
  uploadTrigger.addEventListener("click", () => fileInput.click());
  
  fileInput.addEventListener("change", async () => {
    if (!fileInput.files?.[0]) return;
    
    try {
      insertBtn.disabled = true;
      insertBtn.textContent = "Uploading...";
      
      currentImageSrc = await uploadEnhancedImageFile(fileInput.files[0]);
      showPreview(currentImageSrc);
      checkValidation();
      
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      insertBtn.disabled = false;
      insertBtn.textContent = "Insert Image";
    }
  });

  // Drag and drop
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("drag-over");
  });

  dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    
    const files = Array.from(e.dataTransfer?.files || []);
    const imageFile = files.find(f => f.type.startsWith("image/"));
    
    if (imageFile) {
      try {
        insertBtn.disabled = true;
        insertBtn.textContent = "Uploading...";
        
        currentImageSrc = await uploadEnhancedImageFile(imageFile);
        showPreview(currentImageSrc);
        checkValidation();
        
      } catch (error) {
        alert(error instanceof Error ? error.message : "Upload failed");
      } finally {
        insertBtn.disabled = false;
        insertBtn.textContent = "Insert Image";
      }
    }
  });

  // URL input with better validation
  urlInput.addEventListener("input", () => {
    const url = urlInput.value.trim();
    if (url && isValidImageUrl(url)) {
      currentImageSrc = url;
      showPreview(url);
    } else {
      currentImageSrc = "";
      hidePreview();
    }
    checkValidation();
  });

  // URL validation on blur
  urlInput.addEventListener("blur", () => {
    const url = urlInput.value.trim();
    if (url && !isValidImageUrl(url)) {
      alert("Please enter a valid image URL (jpg, jpeg, png, gif, webp, svg)");
      urlInput.focus();
    }
  });

  function isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(pathname) ||
             url.includes('unsplash.com') ||
             url.includes('pexels.com') ||
             url.includes('pixabay.com') ||
             url.includes('cloudinary.com') ||
             url.includes('imgur.com');
    } catch {
      return false;
    }
  }

  function showPreview(src: string) {
    previewImg.src = src;
    previewImg.onerror = () => {
      previewContainer.style.display = "none";
      alert("Failed to load image. Please check the URL.");
      currentImageSrc = "";
      checkValidation();
    };
    previewImg.onload = () => {
      previewContainer.style.display = "block";
    };
  }

  function hidePreview() {
    previewContainer.style.display = "none";
  }

  function checkValidation() {
    const hasImage = !!currentImageSrc;
    insertBtn.disabled = !hasImage;
  }

  // Close buttons
  const closeDialog = () => {
    overlay.remove();
    view.focus();
    document.removeEventListener("keydown", handleEscape);
  };
  
  // Escape key handler
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeDialog();
    }
  };
  
  document.addEventListener("keydown", handleEscape);
  
  // Click overlay to close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });
  
  cancelBtn.addEventListener("click", closeDialog);
  closeBtn.addEventListener("click", closeDialog);

  // Insert button
  insertBtn.addEventListener("click", () => {
    if (!currentImageSrc) {
      alert("Please provide an image");
      return;
    }

    // Validate URL one more time if using URL tab
    const isUrlTab = dialog.querySelector('#url-tab')?.classList.contains('active');
    if (isUrlTab && !isValidImageUrl(currentImageSrc)) {
      alert("Please enter a valid image URL");
      return;
    }

    const attrs: Record<string, any> = {
      src: currentImageSrc,
      alt: altInput.value.trim() || 'Image',
      align: alignSelect.value,
      width: parseInt(widthInput.value) || 320,
      zoomable: zoomCheckbox.checked
    };

    // Add caption if provided
    const caption = captionInput.value.trim();
    if (caption) {
      attrs.caption = caption;
    }

    // Create transaction to insert image node
    const imageNode = view.state.schema.nodes.image.create(attrs);
    const tr = view.state.tr.replaceSelectionWith(imageNode);
    
    view.dispatch(tr);
    console.log('Image inserted successfully:', attrs);
    closeDialog();
  });

  // Focus first input
  setTimeout(() => {
    uploadTrigger.focus();
  }, 100);

  // Add dialog to overlay and return overlay
  overlay.appendChild(dialog);
  return overlay;
}
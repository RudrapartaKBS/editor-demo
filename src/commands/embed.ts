import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { EmbedAttrs } from "../schema/nodes/embed";

export function insertEmbed(
  src: string,
  type: EmbedAttrs['type'] = 'iframe',
  width: number = 560,
  height: number = 315,
  title: string = "",
  align: EmbedAttrs['align'] = 'center'
) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { schema, selection } = state;
    const embedNode = schema.nodes.embed;

    if (!embedNode) {
      return false;
    }

    const attrs: EmbedAttrs = {
      src,
      type,
      width,
      height,
      title,
      align
    };

    const node = embedNode.create(attrs);

    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(node);
      dispatch(tr);
    }

    return true;
  };
}

export function detectEmbedType(url: string): EmbedAttrs['type'] {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  } else if (urlLower.includes('vimeo.com')) {
    return 'vimeo';
  } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  } else if (urlLower.includes('instagram.com')) {
    return 'instagram';
  } else if (urlLower.includes('tiktok.com')) {
    return 'tiktok';
  }
  
  return 'iframe';
}

export function createEmbedDialog(view: EditorView): HTMLElement {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "myeditor-overlay";
  
  const dialog = document.createElement("div");
  dialog.className = "myeditor-embed-dialog myeditor-enhanced-dialog";
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>🎬 Embed Media</h3>
      <button class="dialog-close" type="button" aria-label="Close">✕</button>
    </div>
    
    <div class="dialog-body">
      <div class="embed-types">
        <h4>Supported Platforms:</h4>
        <div class="platform-grid">
          <span class="platform-tag youtube">📺 YouTube</span>
          <span class="platform-tag vimeo">🎭 Vimeo</span>
          <span class="platform-tag twitter">🐦 Twitter</span>
          <span class="platform-tag instagram">📷 Instagram</span>
          <span class="platform-tag iframe">🌐 Any Website</span>
        </div>
      </div>
      
      <div class="form-group">
        <label>Media URL:</label>
        <input type="url" class="embed-url-input" placeholder="Paste YouTube, Vimeo, Twitter, Instagram or any URL...">
        <small class="help-text">Paste the URL of the video or content you want to embed</small>
      </div>
      
      <div class="embed-detection" style="display: none;">
        <div class="detected-info">
          <span class="detected-icon">✅</span>
          <span class="detected-text">Detected: <strong class="detected-type">YouTube Video</strong></span>
        </div>
      </div>
      
      <div class="embed-settings">
        <div class="form-row">
          <div class="form-group">
            <label>Width (px):</label>
            <input type="number" class="width-input" value="560" min="200" max="1200" step="10">
          </div>
          <div class="form-group">
            <label>Height (px):</label>
            <input type="number" class="height-input" value="315" min="150" max="800" step="10">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Alignment:</label>
            <select class="align-select">
              <option value="center" selected>Center</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="none">None</option>
            </select>
          </div>
          <div class="form-group">
            <label>Title (optional):</label>
            <input type="text" class="title-input" placeholder="Descriptive title">
          </div>
        </div>
      </div>
      
      <!-- Preview -->
      <div class="embed-preview-container" style="display: none;">
        <label>Preview:</label>
        <div class="embed-preview">
          <iframe class="preview-frame" frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
    </div>
    
    <div class="dialog-actions">
      <button type="button" class="btn-cancel">Cancel</button>
      <button type="button" class="btn-insert" disabled>Embed Media</button>
    </div>
  `;

  // Get elements
  const urlInput = dialog.querySelector(".embed-url-input") as HTMLInputElement;
  const widthInput = dialog.querySelector(".width-input") as HTMLInputElement;
  const heightInput = dialog.querySelector(".height-input") as HTMLInputElement;
  const alignSelect = dialog.querySelector(".align-select") as HTMLSelectElement;
  const titleInput = dialog.querySelector(".title-input") as HTMLInputElement;
  const insertBtn = dialog.querySelector(".btn-insert") as HTMLButtonElement;
  const cancelBtn = dialog.querySelector(".btn-cancel") as HTMLButtonElement;
  const closeBtn = dialog.querySelector(".dialog-close") as HTMLButtonElement;
  const detectionDiv = dialog.querySelector(".embed-detection") as HTMLElement;
  const detectedType = dialog.querySelector(".detected-type") as HTMLElement;
  const previewContainer = dialog.querySelector(".embed-preview-container") as HTMLElement;
  const previewFrame = dialog.querySelector(".preview-frame") as HTMLIFrameElement;

  let currentUrl = "";
  let currentType: EmbedAttrs['type'] = 'iframe';

  // URL input handling
  urlInput.addEventListener("input", () => {
    const url = urlInput.value.trim();
    
    if (url) {
      currentUrl = url;
      currentType = detectEmbedType(url);
      
      // Show detection
      detectedType.textContent = getTypeDisplayName(currentType);
      detectionDiv.style.display = "block";
      
      // Show preview
      showPreview(url, currentType);
      
      insertBtn.disabled = false;
      insertBtn.textContent = "Embed Media";
    } else {
      detectionDiv.style.display = "none";
      previewContainer.style.display = "none";
      insertBtn.disabled = true;
      insertBtn.textContent = "Embed Media";
      currentUrl = "";
    }
  });

  // URL validation on blur
  urlInput.addEventListener("blur", () => {
    if (currentUrl && !isValidUrl(currentUrl)) {
      console.warn("Invalid URL format:", currentUrl);
      // Don't show error for now, just log it
    }
  });

  function getTypeDisplayName(type: EmbedAttrs['type']): string {
    switch (type) {
      case 'youtube': return 'YouTube Video';
      case 'vimeo': return 'Vimeo Video';
      case 'twitter': return 'Twitter Post';
      case 'instagram': return 'Instagram Post';
      case 'tiktok': return 'TikTok Video';
      default: return 'Website/iframe';
    }
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function showPreview(url: string, type: EmbedAttrs['type']) {
    const embedUrl = getEmbedUrl(url, type);
    previewFrame.src = embedUrl;
    previewFrame.width = "100%";
    previewFrame.height = "200";
    previewContainer.style.display = "block";
    
    // Handle iframe load errors
    previewFrame.onerror = () => {
      console.warn('Preview failed to load:', embedUrl);
      // Still show the container, as some embeds block preview but work when inserted
    };
  }

  function getEmbedUrl(url: string, type: EmbedAttrs['type']): string {
    switch (type) {
      case 'youtube':
        return convertYouTubeUrl(url);
      case 'vimeo':
        return convertVimeoUrl(url);
      case 'twitter':
        return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
      case 'instagram':
        return url.endsWith('/') ? `${url}embed/` : `${url}/embed/`;
      default:
        return url;
    }
  }

  function convertYouTubeUrl(url: string): string {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[7].length === 11 ? match[7] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  }

  function convertVimeoUrl(url: string): string {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    const videoId = match ? match[1] : null;
    
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  }

  // Close handlers
  const closeDialog = () => {
    overlay.remove();
    view.focus();
    document.removeEventListener("keydown", handleEscape);
  };
  
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeDialog();
    }
  };
  
  document.addEventListener("keydown", handleEscape);
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });
  
  cancelBtn.addEventListener("click", closeDialog);
  closeBtn.addEventListener("click", closeDialog);

  // Insert button
  insertBtn.addEventListener("click", () => {
    if (!currentUrl) {
      alert("Please provide a URL");
      return;
    }

    const attrs: EmbedAttrs = {
      src: currentUrl,
      type: currentType,
      width: parseInt(widthInput.value) || 560,
      height: parseInt(heightInput.value) || 315,
      title: titleInput.value.trim(),
      align: alignSelect.value as EmbedAttrs['align']
    };

    const embedNode = view.state.schema.nodes.embed.create(attrs);
    const tr = view.state.tr.replaceSelectionWith(embedNode);
    
    view.dispatch(tr);
    console.log('Embed inserted successfully:', attrs);
    closeDialog();
  });

  // Focus URL input
  setTimeout(() => {
    urlInput.focus();
  }, 100);

  overlay.appendChild(dialog);
  return overlay;
}
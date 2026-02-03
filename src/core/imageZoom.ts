// Image zoom functionality
export function initImageZoom() {
  // Create zoom overlay if it doesn't exist
  let overlay: HTMLElement | null = null;
  
  function createZoomOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'image-zoom-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', closeZoom);
    
    return overlay;
  }
  
  function openZoom(img: HTMLImageElement) {
    if (!overlay) {
      overlay = createZoomOverlay();
    }
    
    const zoomedImg = img.cloneNode(true) as HTMLImageElement;
    overlay.innerHTML = '';
    overlay.appendChild(zoomedImg);
    overlay.style.display = 'flex';
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  }
  
  function closeZoom() {
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
  
  // Add click listeners to zoomable images
  function attachZoomListeners() {
    const zoomableImages = document.querySelectorAll('img.zoomable');
    
    zoomableImages.forEach((img) => {
      const imageEl = img as HTMLImageElement;
      
      // Remove existing listener if any
      imageEl.removeEventListener('click', handleImageClick);
      
      // Add new listener
      imageEl.addEventListener('click', handleImageClick);
    });
  }
  
  function handleImageClick(event: Event) {
    event.preventDefault();
    const img = event.target as HTMLImageElement;
    openZoom(img);
  }
  
  // Initialize on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachZoomListeners);
  } else {
    attachZoomListeners();
  }
  
  // Use MutationObserver to detect new images
  const observer = new MutationObserver(() => {
    attachZoomListeners();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // ESC key to close zoom
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay && overlay.style.display !== 'none') {
      closeZoom();
    }
  });
  
  return {
    destroy: () => {
      observer.disconnect();
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
    },
    refresh: attachZoomListeners,
  };
}
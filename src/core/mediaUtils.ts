// Media upload utilities
export interface UploadConfig {
  maxFileSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // default: common image types
  uploadEndpoint?: string; // for server uploads
}

export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
};

export function validateFile(file: File, config: UploadConfig = {}): { valid: boolean; error?: string } {
  const finalConfig = { ...DEFAULT_UPLOAD_CONFIG, ...config };
  
  // Check file type
  if (finalConfig.allowedTypes && !finalConfig.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${finalConfig.allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  if (finalConfig.maxFileSize && file.size > finalConfig.maxFileSize) {
    const maxSizeMB = Math.round(finalConfig.maxFileSize / 1024 / 1024 * 10) / 10;
    return {
      valid: false,
      error: `File size (${Math.round(file.size / 1024 / 1024 * 10) / 10}MB) exceeds limit of ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

export async function uploadToDataUrl(file: File, config?: UploadConfig): Promise<string> {
  const validation = validateFile(file, config);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadToServer(file: File, config: UploadConfig): Promise<string> {
  const validation = validateFile(file, config);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  if (!config.uploadEndpoint) {
    throw new Error('Upload endpoint not configured');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(config.uploadEndpoint, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.url || data.src; // Adjust based on your API response
  } catch (error) {
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility to compress images before upload (optional)
export function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file); // fallback to original
        }
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// Create a thumbnail for preview
export function createThumbnail(file: File, size = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      
      // Calculate crop area (center crop)
      const scale = Math.max(size / img.width, size / img.height);
      const x = (img.width - size / scale) / 2;
      const y = (img.height - size / scale) / 2;
      
      ctx.drawImage(img, x, y, size / scale, size / scale, 0, 0, size, size);
      
      resolve(canvas.toDataURL());
    };
    
    img.onerror = () => reject(new Error('Failed to create thumbnail'));
    img.src = URL.createObjectURL(file);
  });
}
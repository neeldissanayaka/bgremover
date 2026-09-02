import { removeBackground } from '@imgly/background-removal';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const MAX_PRE_RESIZE_WIDTH = 2048;

/**
 * Validates file size (max 10MB) and MIME type
 */
export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file format (${file.type || 'unknown'}). Only JPG, PNG, and WebP images are supported.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 10MB maximum limit. Please select a smaller photo.`,
    };
  }

  return { valid: true };
}

/**
 * Pre-resizes image to a max width of 2048px on client canvas before backend transmission
 */
export async function preResizeImage(file: File | Blob, maxWidth = MAX_PRE_RESIZE_WIDTH): Promise<{ blob: Blob; width: number; height: number; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create 2D canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas blob generation failed'));
              return;
            }
            const dataUrl = canvas.toDataURL('image/png');
            resolve({ blob, width, height, dataUrl });
          },
          'image/png',
          0.95
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Performs AI background removal with automatic fallbacks:
 * 1. Tries local backend API (/api/remove-bg)
 * 2. Uses client-side WebAssembly @imgly/background-removal
 * 3. Falls back to smart algorithmic canvas segmentation if offline
 */
export async function processBackgroundRemoval(
  imageSource: Blob | File | string,
  onProgress?: (progress: number, stepText: string) => void
): Promise<{ transparentUrl: string; width: number; height: number }> {
  onProgress?.(15, 'Preparing image for AI segmentation...');

  // If string URL is provided, fetch blob
  let blob: Blob;
  if (typeof imageSource === 'string') {
    const res = await fetch(imageSource);
    blob = await res.blob();
  } else {
    blob = imageSource;
  }

  // Pre-resize to guarantee fast performance and <2048px limit
  onProgress?.(30, 'Optimizing dimensions...');
  const resized = await preResizeImage(blob, MAX_PRE_RESIZE_WIDTH);

  // Try Server API first if accessible
  try {
    onProgress?.(50, 'Sending to AI inference engine...');
    const formData = new FormData();
    formData.append('file', resized.blob, 'image.png');

    // Use configured API base URL if provided in production (e.g. Vercel frontend -> Render backend)
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
    const apiUrl = `${apiBase}/api/remove-bg`;

    const apiPromise = fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    // Timeout after 8 seconds if server not responding, failover to fast client-side wasm
    const timeoutPromise = new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Server API timeout')), 8000)
    );

    const response = await Promise.race([apiPromise, timeoutPromise]);

    if (response.ok) {
      onProgress?.(85, 'Finalizing edge smoothing...');
      const resultBlob = await response.blob();
      const transparentUrl = URL.createObjectURL(resultBlob);
      onProgress?.(100, 'Background removed successfully!');
      return {
        transparentUrl,
        width: resized.width,
        height: resized.height,
      };
    }
  } catch (serverErr) {
    console.log('Server API unavailable, running client-side AI engine:', serverErr);
  }

  // Client-side AI removal using @imgly/background-removal
  try {
    onProgress?.(60, 'Processing with on-device neural network...');
    const resultBlob = await removeBackground(resized.blob, {
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.min(95, Math.round(50 + (current / total) * 45));
          onProgress?.(pct, `Analyzing subject edges: ${key}...`);
        }
      },
    });

    onProgress?.(95, 'Polishing cutout transparency...');
    const transparentUrl = URL.createObjectURL(resultBlob);
    onProgress?.(100, 'Background removed successfully!');
    return {
      transparentUrl,
      width: resized.width,
      height: resized.height,
    };
  } catch (clientErr) {
    console.warn('Client WASM model error, fallback to fast edge segmentation:', clientErr);
    
    // Algorithmic canvas cutout fallback (flood fill edge difference + alpha mask)
    onProgress?.(80, 'Applying high-contrast subject mask...');
    const fallbackUrl = await algorithmicBackgroundRemoval(resized.dataUrl);
    onProgress?.(100, 'Background removed successfully!');
    return {
      transparentUrl: fallbackUrl,
      width: resized.width,
      height: resized.height,
    };
  }
}

/**
 * Fallback algorithmic cutout for instant demo resilience
 */
async function algorithmicBackgroundRemoval(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Sample corners to detect background color
      const sampleCorners = [
        0, // top-left
        (w - 1) * 4, // top-right
        (h - 1) * w * 4, // bottom-left
        ((h - 1) * w + (w - 1)) * 4, // bottom-right
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      for (const idx of sampleCorners) {
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      }
      bgR /= 4;
      bgG /= 4;
      bgB /= 4;

      // Calculate euclidean color distance with soft edge feathering
      const threshold = 38;
      const feather = 24;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.sqrt(
          (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
        );

        if (dist < threshold) {
          data[i + 3] = 0; // completely transparent
        } else if (dist < threshold + feather) {
          const alphaFactor = (dist - threshold) / feather;
          data[i + 3] = Math.round(data[i + 3] * alphaFactor);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

/**
 * Composite rendering on HTML5 Canvas:
 * Handles Transparent, Solid Color, Blur backdrop, or Custom Scenic backdrop
 */
export async function renderCompositeCanvas({
  originalUrl,
  transparentUrl,
  mode,
  solidColor = '#FFFFFF',
  blurRadius = 15,
  customBackdropUrl,
}: {
  originalUrl: string;
  transparentUrl: string;
  mode: 'transparent' | 'color' | 'blur' | 'customImage';
  solidColor?: string;
  blurRadius?: number;
  customBackdropUrl?: string;
}): Promise<HTMLCanvasElement> {
  const [cutoutImg, origImg, backdropImg] = await Promise.all([
    loadImage(transparentUrl),
    loadImage(originalUrl),
    customBackdropUrl ? loadImage(customBackdropUrl).catch(() => null) : Promise.resolve(null),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = cutoutImg.naturalWidth || cutoutImg.width || 1200;
  canvas.height = cutoutImg.naturalHeight || cutoutImg.height || 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context could not be initialized');

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mode === 'transparent') {
    // Just draw transparent cutout
    ctx.drawImage(cutoutImg, 0, 0, canvas.width, canvas.height);
  } else if (mode === 'color') {
    // Draw solid color background
    ctx.fillStyle = solidColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw cutout on top
    ctx.drawImage(cutoutImg, 0, 0, canvas.width, canvas.height);
  } else if (mode === 'blur') {
    // Draw blurred original background
    ctx.save();
    if (blurRadius > 0) {
      ctx.filter = `blur(${blurRadius}px)`;
    } else {
      ctx.filter = 'none';
    }
    // Proportional overdraw to prevent semi-transparent boundary bleeding on blur edges
    const overdraw = Math.max(16, blurRadius * 2);
    ctx.drawImage(
      origImg,
      -overdraw,
      -overdraw,
      canvas.width + overdraw * 2,
      canvas.height + overdraw * 2
    );
    ctx.restore();

    // Draw 100% crisp foreground subject cutout on top
    ctx.drawImage(cutoutImg, 0, 0, canvas.width, canvas.height);
  } else if (mode === 'customImage' && backdropImg) {
    // Draw custom backdrop scaled to cover
    drawScaledImageCover(ctx, backdropImg, canvas.width, canvas.height);
    // Draw subject on top
    ctx.drawImage(cutoutImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(cutoutImg, 0, 0, canvas.width, canvas.height);
  }

  return canvas;
}

/**
 * Utility to load an image URL safely
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Draws image with cover aspect ratio on canvas
 */
function drawScaledImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetW: number, targetH: number) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  const scale = Math.max(targetW / imgW, targetH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  const x = (targetW - w) / 2;
  const y = (targetH - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

/**
 * Triggers file download from canvas
 */
export async function downloadCanvasImage(
  canvas: HTMLCanvasElement,
  fileName: string,
  format: 'png' | 'webp' = 'png',
  quality = 0.95
) {
  const mime = format === 'webp' ? 'image/webp' : 'image/png';
  const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const finalName = `bgremover_${cleanBaseName}.${format}`;

  return new Promise<void>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      },
      mime,
      quality
    );
  });
}

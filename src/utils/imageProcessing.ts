import { removeBackground } from '@imgly/background-removal';
import type { BackgroundMode } from '../types';
import {
  verifyImageMagicBytes,
  validateImageDimensions,
  IMAGE_SECURITY_LIMITS,
  sanitizeFileName,
} from './security';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const MAX_FILE_SIZE_BYTES = IMAGE_SECURITY_LIMITS.MAX_FILE_SIZE_BYTES; // 15MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const MAX_PRE_RESIZE_WIDTH = 2048;

/**
 * Validates file size (max 15MB) and MIME type
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
      error: `File size (${sizeMb} MB) exceeds the 15MB maximum limit. Please select a smaller photo.`,
    };
  }

  return { valid: true };
}

/**
 * Asynchronous deep validation including Magic Bytes signature verification
 */
export async function validateImageFileSecure(file: File | Blob): Promise<ValidationResult> {
  // 1. Basic size limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum 15MB limit.`,
    };
  }

  // 2. Binary Magic Bytes signature validation (Prevents polyglot malware & renamed executables)
  const magicCheck = await verifyImageMagicBytes(file);
  if (!magicCheck.isValid) {
    return {
      valid: false,
      error: magicCheck.error || 'Invalid image header signature.',
    };
  }

  return { valid: true };
}

/**
 * Pre-resizes image to a max width of 2048px on client canvas before backend transmission,
 * while validating image dimensions against pixel-bomb / decompression attacks.
 */
export async function preResizeImage(file: File | Blob, maxWidth = MAX_PRE_RESIZE_WIDTH): Promise<{ blob: Blob; width: number; height: number; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Security check: Decompression Bomb prevention
        const dimCheck = validateImageDimensions(width, height);
        if (!dimCheck.isValid) {
          reject(new Error(dimCheck.error || 'Image dimensions exceed security limits.'));
          return;
        }

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
    if (!res.ok) {
      throw new Error(`Failed to load image from URL (HTTP ${res.status}).`);
    }
    blob = await res.blob();
  } else {
    blob = imageSource;
  }

  // Security check: Validate file integrity & Magic Bytes
  const secValidation = await validateImageFileSecure(blob);
  if (!secValidation.valid) {
    throw new Error(secValidation.error || 'Image validation failed.');
  }

  // Pre-resize to guarantee fast performance and <2048px limit
  onProgress?.(30, 'Optimizing dimensions & verifying integrity...');
  const resized = await preResizeImage(blob, MAX_PRE_RESIZE_WIDTH);

  // Use a real server inference endpoint when one is explicitly configured.
  // Do NOT call a missing local endpoint by default.
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (apiBase) {
    try {
      onProgress?.(50, 'Sending to AI inference engine...');
      const formData = new FormData();
      formData.append('file', resized.blob, 'image.png');

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${apiBase}/api/remove-bg`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      if (response.ok) {
        const resultBlob = await response.blob();
        if (!resultBlob.size) throw new Error('AI server returned an empty image.');
        onProgress?.(100, 'Background removed successfully!');
        return {
          transparentUrl: URL.createObjectURL(resultBlob),
          width: resized.width,
          height: resized.height,
        };
      }

      console.warn(`AI server returned HTTP ${response.status}; trying IMG.LY fallback.`);
    } catch (serverErr) {
      console.warn('Configured AI server unavailable; trying IMG.LY fallback:', serverErr);
    }
  }

  // High-quality client-side AI removal.
  // The previous "algorithmic segmentation" fallback produced fake/partial cutouts,
  // so failures are now surfaced instead of silently returning a low-quality result.
  try {
    onProgress?.(60, 'Processing with AI neural network...');
    const resultBlob = await removeBackground(resized.blob, {
      debug: false,
      device: 'cpu',
      model: 'isnet_fp16',
      output: {
        format: 'image/png',
        quality: 1,
      },
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.min(95, Math.round(50 + (current / total) * 45));
          onProgress?.(pct, `Analyzing subject edges: ${key}...`);
        }
      },
    });

    if (!resultBlob.size) throw new Error('AI engine returned an empty result.');

    onProgress?.(100, 'Background removed successfully!');
    return {
      transparentUrl: URL.createObjectURL(resultBlob),
      width: resized.width,
      height: resized.height,
    };
  } catch (clientErr) {
    console.error('Background removal AI failed:', clientErr);
    throw new Error(
      'Background removal AI could not load. Please check the network connection and try again.'
    );
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
}

export interface CompositeCanvasOptions {
  originalUrl: string;
  transparentUrl: string;
  mode: BackgroundMode;
  solidColor?: string;
  blurRadius?: number;
  customBackdropUrl?: string;
}

/**
 * Renders the final composite cutout + selected backdrop to an offscreen canvas
 */
export async function renderCompositeCanvas(
  options: CompositeCanvasOptions
): Promise<HTMLCanvasElement> {
  const cutoutImg = await loadImageElement(options.transparentUrl);
  const width = cutoutImg.naturalWidth || cutoutImg.width;
  const height = cutoutImg.naturalHeight || cutoutImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context for rendering composite');
  }

  // Draw background layer based on mode
  if (options.mode === 'color') {
    ctx.fillStyle = options.solidColor || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  } else if (options.mode === 'blur') {
    try {
      const bgImg = await loadImageElement(options.originalUrl);
      ctx.save();
      const blur = options.blurRadius ?? 15;
      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
      }
      // Scale slightly up to prevent dark blur edges
      const scale = blur > 0 ? 1.05 : 1;
      const w = width * scale;
      const h = height * scale;
      const x = (width - w) / 2;
      const y = (height - h) / 2;
      ctx.drawImage(bgImg, x, y, w, h);
      ctx.restore();
    } catch (e) {
      console.warn('Failed to draw blur background:', e);
    }
  } else if (options.mode === 'customImage' && options.customBackdropUrl) {
    try {
      const bgImg = await loadImageElement(options.customBackdropUrl);
      const bgW = bgImg.naturalWidth || bgImg.width;
      const bgH = bgImg.naturalHeight || bgImg.height;
      const scale = Math.max(width / bgW, height / bgH);
      const w = bgW * scale;
      const h = bgH * scale;
      const x = (width - w) / 2;
      const y = (height - h) / 2;
      ctx.drawImage(bgImg, x, y, w, h);
    } catch (e) {
      console.warn('Failed to draw custom backdrop image:', e);
    }
  }

  // Draw foreground cutout subject on top
  ctx.drawImage(cutoutImg, 0, 0, width, height);

  return canvas;
}

/**
 * Downloads the rendered canvas as a PNG or WebP file
 */
export async function downloadCanvasImage(
  canvas: HTMLCanvasElement,
  fileName: string,
  format: 'png' | 'webp' = 'png',
  quality = 0.95
): Promise<void> {
  const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create download image blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const cleanName = sanitizeFileName(fileName.replace(/\.[^/.]+$/, ''));
        a.download = `${cleanName || 'bgremover_cutout'}.${format}`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        resolve();
      },
      mimeType,
      quality
    );
  });
}


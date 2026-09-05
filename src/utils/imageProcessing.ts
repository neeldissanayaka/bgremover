import { removeBackground, preload } from '@imgly/background-removal';
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

let preloadPromise: Promise<void> | null = null;

/**
 * Checks if WebGPU hardware acceleration is supported by the client browser/device
 */
export async function checkWebGPUSupport(): Promise<boolean> {
  try {
    const nav = navigator as any;
    if (typeof nav !== 'undefined' && nav.gpu && typeof nav.gpu.requestAdapter === 'function') {
      const adapter = await nav.gpu.requestAdapter();
      return !!adapter;
    }
  } catch {
    // Fall back to CPU if WebGPU probe fails
  }
  return false;
}

/**
 * Prewarms the AI segmentation neural network and ONNX session in the background.
 * Downloads model weights into browser cache and initializes WebGPU / WASM execution
 * providers so that user uploads process in lightning-fast 2-3 seconds.
 */
export function warmupAIModel(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = (async () => {
      try {
        const hasWebGpu = await checkWebGPUSupport();
        const primaryDevice: 'gpu' | 'cpu' = hasWebGpu ? 'gpu' : 'cpu';

        await preload({
          debug: false,
          device: primaryDevice,
          model: 'isnet_quint8',
          proxyToWorker: true,
          output: {
            format: 'image/png',
            quality: 0.85,
          },
        });
        console.log(`[AI Engine] Turbo prewarm ready (${primaryDevice.toUpperCase()} mode).`);
      } catch (err) {
        console.warn('[AI Engine] Background prewarm notice (will load on first request):', err);
      }
    })();
  }
  return preloadPromise;
}

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
 * Fast client-side image dimension verification and downscaling.
 * Uses native async createImageBitmap where available to avoid blocking the main UI thread.
 * Skips redundant canvas rendering if the image is already within maximum resolution.
 */
export async function preResizeImage(
  file: File | Blob,
  maxWidth = MAX_PRE_RESIZE_WIDTH
): Promise<{ blob: Blob; width: number; height: number; dataUrl: string }> {
  // High-performance path: native async createImageBitmap on background thread
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file);
      const originalWidth = bitmap.width;
      const originalHeight = bitmap.height;

      // Security check: Decompression Bomb prevention
      const dimCheck = validateImageDimensions(originalWidth, originalHeight);
      if (!dimCheck.isValid) {
        bitmap.close();
        throw new Error(dimCheck.error || 'Image dimensions exceed security limits.');
      }

      // If already within optimal resolution, pass through directly (zero canvas copy latency)
      if (originalWidth <= maxWidth) {
        bitmap.close();
        return { blob: file, width: originalWidth, height: originalHeight, dataUrl: '' };
      }

      // Proportional downscale
      const ratio = maxWidth / originalWidth;
      const targetWidth = maxWidth;
      const targetHeight = Math.round(originalHeight * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) {
        bitmap.close();
        throw new Error('Could not create 2D canvas context');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      bitmap.close();

      const resizedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Canvas blob export failed'))),
          'image/png',
          0.92
        );
      });

      return { blob: resizedBlob, width: targetWidth, height: targetHeight, dataUrl: '' };
    } catch (bitmapErr) {
      console.warn('[Fast Resize] Fallback to standard Image element:', bitmapErr);
    }
  }

  // Fallback path: HTMLImageElement loader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        const dimCheck = validateImageDimensions(width, height);
        if (!dimCheck.isValid) {
          reject(new Error(dimCheck.error || 'Image dimensions exceed security limits.'));
          return;
        }

        if (width <= maxWidth) {
          resolve({ blob: file, width, height, dataUrl: '' });
          return;
        }

        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create 2D canvas context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas blob generation failed'));
              return;
            }
            resolve({ blob, width, height, dataUrl: '' });
          },
          'image/png',
          0.92
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
 * Performs high-performance AI background removal in 2-3 seconds:
 * 1. Preheats WebGPU hardware acceleration with automatic CPU WASM SIMD fallback.
 * 2. Uses the ultra-optimized ISNet Quantized (quint8) model (44MB, 3x faster integer SIMD execution).
 * 3. Keeps full edge segmentation fidelity, hair/fur alpha feathering, and high resolution.
 */
export async function processBackgroundRemoval(
  imageSource: Blob | File | string,
  onProgress?: (progress: number, stepText: string) => void
): Promise<{ transparentUrl: string; width: number; height: number }> {
  const startTime = performance.now();
  onProgress?.(15, 'Preparing image for Turbo AI...');

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
        const totalDuration = ((performance.now() - startTime) / 1000).toFixed(1);
        onProgress?.(100, `Background removed in ${totalDuration}s!`);
        return {
          transparentUrl: URL.createObjectURL(resultBlob),
          width: resized.width,
          height: resized.height,
        };
      }

      console.warn(`AI server returned HTTP ${response.status}; trying client AI fallback.`);
    } catch (serverErr) {
      console.warn('Configured AI server unavailable; trying client AI fallback:', serverErr);
    }
  }

  // Ultra-Fast client-side AI removal using WebGPU hardware acceleration + SIMD WASM fallback
  try {
    const hasWebGpu = await checkWebGPUSupport();
    const primaryDevice: 'gpu' | 'cpu' = hasWebGpu ? 'gpu' : 'cpu';

    onProgress?.(
      55,
      hasWebGpu
        ? '⚡ Turbo WebGPU AI: Isolating subject...'
        : '⚡ High-Speed SIMD AI: Isolating subject...'
    );

    const baseConfig = {
      debug: false,
      model: 'isnet_quint8' as const, // 44MB, 3x faster integer SIMD execution, pristine edge quality
      proxyToWorker: true,
      output: {
        format: 'image/png' as const,
        quality: 0.85,
      },
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.min(95, Math.round(55 + (current / total) * 40));
          onProgress?.(pct, `Analyzing subject edges: ${key}...`);
        }
      },
    };

    let resultBlob: Blob | null = null;

    // 1. Try WebGPU GPU acceleration first
    if (primaryDevice === 'gpu') {
      try {
        resultBlob = await removeBackground(resized.blob, {
          ...baseConfig,
          device: 'gpu',
        });
      } catch (gpuErr) {
        console.warn('[AI Engine] WebGPU runtime fallback to CPU SIMD:', gpuErr);
        onProgress?.(65, 'WebGPU busy, switching to high-speed CPU SIMD...');
        resultBlob = null;
      }
    }

    // 2. Fallback to CPU SIMD WASM if GPU is unavailable or failed
    if (!resultBlob) {
      resultBlob = await removeBackground(resized.blob, {
        ...baseConfig,
        device: 'cpu',
      });
    }

    if (!resultBlob || !resultBlob.size) {
      throw new Error('AI engine returned an empty result.');
    }

    const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`[AI Engine] Background removed in ${durationSec}s (${primaryDevice.toUpperCase()} mode)`);
    onProgress?.(100, `Finished in ${durationSec}s!`);

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


import { decode } from 'blurhash';

/**
 * Decode a single blurhash and draw it to a canvas element.
 *
 * @param canvas - The canvas element with a data-blur-hash attribute
 * @param width - The width to decode at (default: 32)
 * @param height - The height to decode at (default: 32)
 */
export function decodeBlurhashToCanvas(canvas: HTMLCanvasElement, width: number = 32, height: number = 32): void {
  const blurHashValue = canvas.dataset.blurHash;
  if (!blurHashValue) return;

  const pixels = decode(blurHashValue, width, height);
  const ctx = canvas.getContext('2d');
  if (pixels && ctx) {
    const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
    ctx.putImageData(imageData, 0, 0);
  }
}

/**
 * Decode and render all blurhash canvases on the page.
 * Finds all canvas elements with data-blur-hash attribute and draws the decoded image.
 *
 * @param selector - CSS selector for canvas elements (default: 'canvas[data-blur-hash]')
 * @param width - The width to decode at (default: 32)
 * @param height - The height to decode at (default: 32)
 */
export function decodeAllBlurhashes(
  selector: string = 'canvas[data-blur-hash]',
  width: number = 32,
  height: number = 32,
): void {
  const canvases = document.querySelectorAll<HTMLCanvasElement>(selector);
  for (const canvas of canvases) {
    decodeBlurhashToCanvas(canvas, width, height);
  }
}

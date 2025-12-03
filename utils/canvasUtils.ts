/**
 * Adds a subtle noise texture to the canvas for better visual quality
 */
export function addNoiseTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity = 0.03
) {
  // Create a temporary canvas for the noise
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 100;
  noiseCanvas.height = 100;
  
  const noiseCtx = noiseCanvas.getContext('2d');
  if (!noiseCtx) return;
  
  // Generate noise
  const imageData = noiseCtx.createImageData(100, 100);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() * 255;
    data[i] = value;     // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
    data[i + 3] = 255;   // A
  }
  
  noiseCtx.putImageData(imageData, 0, 0);
  
  // Apply the noise as a pattern
  const pattern = ctx.createPattern(noiseCanvas, 'repeat');
  if (!pattern) return;
  
  ctx.save();
  ctx.fillStyle = pattern;
  ctx.globalAlpha = opacity;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Wraps text to fit within a specified width
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string
): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = words[0];
  
  ctx.font = font;
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  lines.push(currentLine);
  return lines;
}

/**
 * Draws a rounded rectangle on the canvas
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

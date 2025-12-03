
import { CardConfig, QRCodePlacement, HeadlinePlacement, LinkType, LayoutMode, PlatformType, AnchorPoint } from "../types";
import { getCanvasDimensions, getAbsolutePosition, ensureSafePosition } from "../utils/layoutUtils";
import { addNoiseTexture, wrapText, roundRect } from "../utils/canvasUtils";

// Safety zone to ensure text never hits the edge (in pixels)
const SAFE_MARGIN = 60;

/**
 * Renders the product card to a hidden canvas and returns the Data URL.
 */
export const generateCardImage = async (config: CardConfig, qrCanvas: HTMLCanvasElement): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Get canvas dimensions based on layout mode
  const { width, height } = getCanvasDimensions(config.layoutMode || LayoutMode.FEED);
  canvas.width = width;
  canvas.height = height;
  
  // Store dimensions in config for reference
  config.canvasWidth = width;
  config.canvasHeight = height;

  // Font Mapping - Added Emoji Support
  const fontFamily = config.fontFamily || 'Inter';
  const emojiFonts = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
  
  // Dynamic font sizes based on layout mode
  const isStory = config.layoutMode === LayoutMode.STORY;
  const isSquare = config.layoutMode === LayoutMode.SQUARE;
  
  const titleFontSize = isStory ? 84 : (isSquare ? 88 : 96);
  const titleFont = `bold ${titleFontSize}px ${fontFamily}, ${emojiFonts}, sans-serif`;
  const ctaFont = `bold ${isStory ? 38 : 42}px Inter, ${emojiFonts}, sans-serif`;
  const priceFont = `bold ${isStory ? 64 : 72}px ${fontFamily}, ${emojiFonts}, sans-serif`;
  const badgeFont = `bold ${isStory ? 28 : 32}px Inter, ${emojiFonts}, sans-serif`;

  // --- 1. Background ---
  // Use Linear Gradient for the base
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, config.backgroundGradient?.[0] || '#1a1a1a');
  gradient.addColorStop(1, config.backgroundGradient?.[1] || '#000000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add subtle noise texture for better visual quality
  if (config.backgroundGradient) {
    addNoiseTexture(ctx, width, height);
  }

  // Load Main Image
  const img = new Image();
  if (!config.imageSrc.startsWith('data:')) img.crossOrigin = "anonymous";
  img.src = config.imageSrc;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve(); 
  });

  // Load Logo Image (if exists)
  let logoImg: HTMLImageElement | null = null;
  if (config.logoSrc) {
    logoImg = new Image();
    if (!config.logoSrc.startsWith('data:')) logoImg.crossOrigin = "anonymous";
    logoImg.src = config.logoSrc;
    await new Promise<void>((resolve) => {
        logoImg!.onload = () => resolve();
        logoImg!.onerror = () => resolve();
    });
  }

  // Load Multiple Detail Bubbles
  const detailImages: { img: HTMLImageElement, x: number, y: number }[] = [];
  if (config.detailBubbles && config.detailBubbles.length > 0) {
      await Promise.all(config.detailBubbles.map(async (bubble) => {
          const dImg = new Image();
          if (!bubble.src.startsWith('data:')) dImg.crossOrigin = "anonymous";
          dImg.src = bubble.src;
          await new Promise<void>((resolve) => {
              dImg.onload = () => resolve();
              dImg.onerror = () => resolve();
          });
          detailImages.push({ img: dImg, x: bubble.x, y: bubble.y });
      }));
  }

  const isOverlayMode = config.placement && config.placement !== QRCodePlacement.CARD_BOTTOM;

  // Helper: Split text into lines that fit maxWidth
  const getLines = (text: string, font: string, maxWidth: number) => {
      ctx.font = font;
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
          const width = ctx.measureText(currentLine + " " + words[i]).width;
          if (width < maxWidth) {
              currentLine += " " + words[i];
          } else {
              lines.push(currentLine);
              currentLine = words[i];
          }
      }
      lines.push(currentLine);
      return lines;
  };

  if (isOverlayMode) {
    // --- POSTER MODE (Action Pill + Headline) ---
    
    // Full Bleed Image
    const imgRatio = img.width / img.height;
    const targetRatio = width / height;
    let renderW, renderH, offsetX, offsetY;

    if (imgRatio > targetRatio) {
      renderH = height;
      renderW = height * imgRatio;
      offsetX = (width - renderW) / 2;
      offsetY = 0;
    } else {
      renderW = width;
      renderH = width / imgRatio;
      offsetX = 0;
      offsetY = (height - renderH) / 2;
    }
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    // Gradients for readability (Dynamic height based on content)
    // Only draw gradient at the bottom if the overlay is near the bottom
    const bottomGradient = ctx.createLinearGradient(0, height - 700, 0, height);
    bottomGradient.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGradient.addColorStop(0.4, 'rgba(0,0,0,0.6)');
    bottomGradient.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, height - 700, width, 700);

    // Badge (Top Left or Top Right)
    if (config.badgeText && config.badgePosition) {
        const isRight = config.badgePosition.anchor === AnchorPoint.TOP_RIGHT || 
                       config.badgePosition.anchor === AnchorPoint.BOTTOM_RIGHT;
    }

    // --- FLOATING LOGO (Poster Mode) ---
    if (config.showFloatingLogo) {
        drawFloatingLogo(ctx, config, logoImg, width, height);
    }

    // --- ACTION PILL (Movable) ---
    const pillHeight = 220;
    
    // Apply Vertical Offset (Drag logic)
    const scaleFactor = 3.0; // UPDATED: Match Visual Ratio 1080/360
    const scaledOffset = (config.overlayYOffset || 0) * scaleFactor;

    const pillY = height - pillHeight - SAFE_MARGIN - scaledOffset;
    
    if (config.showActionCard ?? true) {
        const pillWidth = width - (SAFE_MARGIN * 2);
        const pillX = SAFE_MARGIN;
        
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 30;
        
        // Pill Background (Glassmorphism)
        ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        roundRect(ctx, pillX, pillY, pillWidth, pillHeight, 40);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // QR Code Area (Left side of pill)
        let textStartX = pillX + 40; // Default start if no QR
        const qrBoxSize = 160;
        const qrPadding = 30; 
        
        if (config.showQr) {
            const qrQuietZone = 15; // White space inside the box
            
            // White bg for QR
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, pillX + qrPadding, pillY + qrPadding, qrBoxSize, qrBoxSize, 20);
            ctx.fill();
            
            // Draw QR smaller than the white box to create a quiet zone
            const qrDrawSize = qrBoxSize - (qrQuietZone * 2);
            ctx.drawImage(qrCanvas, pillX + qrPadding + qrQuietZone, pillY + qrPadding + qrQuietZone, qrDrawSize, qrDrawSize);
            
            // Shift text start
            textStartX = pillX + qrPadding + qrBoxSize + 40;
        }

        // Text Content (Right side)
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        
        const iconSize = 100;
        const maxTextWidth = pillWidth - (textStartX - pillX) - (iconSize + 60); // Available width
        
        // "Scan to Buy" Label (CTA)
        ctx.fillStyle = config.ctaColor || '#9ca3af';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillText(config.cta.toUpperCase(), textStartX, pillY + 80, maxTextWidth);
        
        // Price
        if (config.price) {
            ctx.fillStyle = config.priceColor || '#ffffff';
            ctx.font = priceFont;
            ctx.fillText(config.price, textStartX, pillY + 160, maxTextWidth);
        }
        
        // Action Icon Circle (Far Right)
        const iconX = pillX + pillWidth - iconSize - 30;
        const iconY = pillY + (pillHeight - iconSize) / 2;
        
        drawActionIcon(ctx, config, logoImg, iconX, iconY, iconSize);
    }

    // --- HEADLINE (AI Positioned + Manual Drag) ---
    const headlineFontStr = `italic ${titleFont}`;
    const maxHeadlineWidth = width - (SAFE_MARGIN * 2);
    const lines = getLines(config.title.toUpperCase(), headlineFontStr, maxHeadlineWidth);
    const lineHeight = titleFontSize * 1.1;
    
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = config.headlineColor || '#ffffff';
    ctx.font = headlineFontStr;

    const placement = config.headlinePlacement || HeadlinePlacement.BOTTOM_LEFT;
    
    let startY = 0;
    let startX = SAFE_MARGIN;
    
    // Calculate Top Offset based on Badge Presence to prevent overlap
    // If badge exists and we are at top, push down.
    const badgeExists = !!config.badgeText;
    const badgeIsLeft = config.badgePosition?.anchor === AnchorPoint.TOP_LEFT || 
                       config.badgePosition?.anchor === AnchorPoint.CENTER_LEFT ||
                       config.badgePosition?.anchor === AnchorPoint.BOTTOM_LEFT;
    
    // RECALIBRATED CONSTANTS to match App Preview visual proportions
    // Preview uses css 'top-20' (80px). 80px * 3 = 240px base.
    // Preview pushes 'marginTop 180px'. (80+180) * 3 = 780px pushed.
    const topOffset = (badgeExists && ((placement === HeadlinePlacement.TOP_LEFT && badgeIsLeft) || placement === HeadlinePlacement.TOP_CENTER)) ? 780 : 240;

    // Apply Manual Drag Offset
    const headlineScaleFactor = 3.0; // MATCH VISUAL RATIO 1:1
    const manualYOffset = (config.headlineYOffset || 0) * headlineScaleFactor;

    if (placement === HeadlinePlacement.TOP_LEFT) {
        ctx.textAlign = 'left';
        startX = SAFE_MARGIN;
        startY = SAFE_MARGIN + topOffset; 
    } else if (placement === HeadlinePlacement.TOP_CENTER) {
        ctx.textAlign = 'center';
        startX = width / 2;
        startY = SAFE_MARGIN + topOffset;
    } else if (placement === HeadlinePlacement.CENTER) {
        ctx.textAlign = 'center';
        startX = width / 2;
        const totalHeight = lines.length * lineHeight;
        startY = (height / 2) - (totalHeight / 2) + lineHeight; 
    } else {
        // BOTTOM_LEFT (Default)
        ctx.textAlign = 'left';
        startX = SAFE_MARGIN;
        
        // RECALIBRATED BOTTOM ANCHOR
        // Preview uses 'bottom-40' (160px). 160px * 3 = 480px from bottom.
        // 1350 - 480 = 870.
        const fixedBottomAnchor = 870; 
        
        // Calculate where the first line starts so we can apply offset correctly
        startY = fixedBottomAnchor - ((lines.length - 1) * lineHeight);
    }

    // Apply the manual drag to the final Y position
    const finalY = startY + manualYOffset;

    lines.forEach((line, index) => {
        ctx.fillText(line, startX, finalY + (index * lineHeight));
    });

  } else {
    // --- CARD MODE (Side-by-Side Magazine Layout) ---
    
    const targetHeight = height * 0.65; // 65% Image, 35% Info
    
    // 1. Draw Product Image (Top 65%)
    const imgRatio = img.width / img.height;
    const targetRatio = width / targetHeight;
    
    let renderW, renderH, offsetX, offsetY;
    if (imgRatio > targetRatio) {
      renderH = targetHeight;
      renderW = targetHeight * imgRatio;
      offsetX = (width - renderW) / 2;
      offsetY = 0;
    } else {
      renderW = width;
      renderH = width / imgRatio;
      offsetX = 0;
      offsetY = (targetHeight - renderH) / 2;
    }

    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, 0, width, targetHeight, 0);
    ctx.clip();
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();

    // 2. Draw Background Curve & Fill
    ctx.fillStyle = config.backgroundGradient?.[0] || config.backgroundColor;
    ctx.beginPath();
    ctx.moveTo(0, targetHeight);
    ctx.quadraticCurveTo(width / 2, targetHeight - 80, width, targetHeight);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();
    
    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillRect(0, targetHeight - 80, width, height - (targetHeight - 80));
    ctx.globalCompositeOperation = 'source-over';

    // 3. Badge (Top Corner of Card)
    if (config.badgeText && config.badgePosition) {
      const position = ensureSafePosition(
        config.badgePosition,
        200, // Estimated badge width
        60,  // Estimated badge height
        width,
        height,
        config.safeZone
      );
      
      if (position) {
        const { x, y } = getAbsolutePosition(
          position,
          width,
          height
        );
        drawBadge(ctx, config.badgeText, x, y, config.badgeColor || config.primaryColor, badgeFont);
      }
    }

    // --- FLOATING LOGO (Card Mode) ---
    if (config.showFloatingLogo) {
        drawFloatingLogo(ctx, config, logoImg, width, height);
    }

    // 4. Layout Grid (Side by Side)
    const contentYStart = targetHeight + 80; // Start below the curve
    const contentHeightAvailable = height - contentYStart - SAFE_MARGIN;
    
    let qrWidth = 0;
    if (config.showQr) {
        qrWidth = 320; // Fixed QR width
    }
    
    // Left Column (Text) - Conditionally drawn based on showActionCard
    if (config.showActionCard ?? true) {
        const leftColWidth = width - (SAFE_MARGIN * 2) - (config.showQr ? (qrWidth + 40) : 0);
        const leftColX = SAFE_MARGIN;
        
        // Measure Text Height to Center Vertically
        const titleLines = getLines(config.title, titleFont, leftColWidth);
        const titleH = titleLines.length * (titleFontSize * 1.1);
        const priceH = config.price ? 80 : 0;
        const ctaH = 50;
        const gap = 30;
        
        const totalTextHeight = titleH + (config.price ? gap : 0) + priceH + gap + ctaH;
        
        // Vertically Center the text block in the available space
        let currentY = contentYStart + (contentHeightAvailable - totalTextHeight) / 2 + titleFontSize; 
        
        // -- Draw Title --
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
        ctx.fillStyle = config.headlineColor || '#ffffff';
        ctx.font = titleFont;
        
        titleLines.forEach(line => {
            ctx.fillText(line, leftColX, currentY);
            currentY += (titleFontSize * 1.1);
        });

        // -- Draw Price --
        if (config.price) {
            currentY += gap/2; 
            ctx.fillStyle = config.priceColor || config.primaryColor;
            ctx.font = priceFont;
            ctx.fillText(config.price, leftColX, currentY);
            currentY += priceH;
        }

        // -- Draw CTA --
        currentY += gap/2;
        ctx.fillStyle = config.ctaColor || '#d1d5db';
        ctx.font = ctaFont;
        ctx.fillText(config.cta, leftColX, currentY);
    }

    // 5. Right Column (QR Code)
    if (config.showQr) {
        const qrX = width - SAFE_MARGIN - qrWidth;
        // Center QR vertically in the bottom panel
        const qrY = contentYStart + (contentHeightAvailable - qrWidth) / 2;

        // White BG
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 20;
        roundRect(ctx, qrX, qrY, qrWidth, qrWidth, 30);
        ctx.fill();
        
        // QR Image
        const quietZone = 20;
        ctx.shadowBlur = 0;
        ctx.drawImage(qrCanvas, qrX + quietZone, qrY + quietZone, qrWidth - (quietZone*2), qrWidth - (quietZone*2));
    }
  }

  // --- DETAIL BUBBLES (GLOBAL - Drawn on top of everything) ---
  // Moved outside if/else so it works for both Card and Poster modes
  detailImages.forEach((bubble) => {
      const bubbleSize = 210; // 1.5x larger than logo (140 * 1.5)
      const bx = bubble.x;
      const by = bubble.y;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 25;
      
      // Border Circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx + bubbleSize/2, by + bubbleSize/2, bubbleSize/2 + 4, 0, Math.PI*2);
      ctx.fill();

      // Clip Circle
      ctx.beginPath();
      ctx.arc(bx + bubbleSize/2, by + bubbleSize/2, bubbleSize/2, 0, Math.PI*2);
      ctx.clip();

      // Cover Mode
      const aspect = bubble.img.width / bubble.img.height;
      let dw = bubbleSize;
      let dh = bubbleSize;
      let dx = bx;
      let dy = by;

      if (aspect > 1) {
          dh = bubbleSize;
          dw = dh * aspect;
          dx = bx - (dw - bubbleSize) / 2;
      } else {
          dw = bubbleSize;
          dh = dw / aspect;
          dy = by - (dh - bubbleSize) / 2;
      }
      
      ctx.drawImage(bubble.img, dx, dy, dw, dh);
      ctx.restore();
  });

  return canvas.toDataURL('image/png');
};

function drawFloatingLogo(ctx: CanvasRenderingContext2D, config: CardConfig, logoImg: HTMLImageElement | null, width: number, height: number) {
    const logoSize = 140; 
    const logoX = config.logoPosition?.x ?? (width/2 - logoSize/2);
    const logoY = config.logoPosition?.y ?? (height/2 - logoSize/2);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 5;

    if (logoImg) {
         const aspect = logoImg.width / logoImg.height;
         let dw = logoSize;
         let dh = logoSize;
         if (aspect > 1) dh = dw / aspect;
         else dw = dh * aspect;
         
         const dx = logoX + (logoSize - dw) / 2;
         const dy = logoY + (logoSize - dh) / 2;
         
         ctx.drawImage(logoImg, dx, dy, dw, dh);
    } else {
         const cx = logoX + logoSize/2;
         const cy = logoY + logoSize/2;
         const s = logoSize;

         ctx.fillStyle = config.primaryColor;
         const bodyW = s * 0.8;
         const bodyH = s * 0.6;
         roundRect(ctx, cx - bodyW/2, cy - bodyH/2 + s*0.1, bodyW, bodyH, s*0.15);
         ctx.fill();
         
         const bumpW = s * 0.4;
         const bumpH = s * 0.15;
         ctx.fillRect(cx - bumpW/2, cy - bodyH/2 - bumpH/2 + s*0.1, bumpW, bumpH);
         
         ctx.fillStyle = '#000000';
         ctx.beginPath();
         ctx.arc(cx, cy + s*0.1, s*0.2, 0, Math.PI*2);
         ctx.fill();
    }
    ctx.restore();
}

function drawActionIcon(ctx: CanvasRenderingContext2D, config: CardConfig, logoImg: HTMLImageElement | null, iconX: number, iconY: number, iconSize: number) {
    if (logoImg) {
         ctx.fillStyle = config.primaryColor;
         ctx.beginPath();
         ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
         ctx.fill();
         
         ctx.save();
         ctx.beginPath();
         ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
         ctx.clip();
         
         const aspect = logoImg.width / logoImg.height;
         let dw = iconSize;
         let dh = iconSize;
         let dx = iconX;
         let dy = iconY;

         if (aspect > 1) {
            dh = iconSize;
            dw = dh * aspect;
            dx = iconX - (dw - iconSize) / 2;
         } else {
            dw = iconSize;
            dh = dw / aspect;
            dy = iconY - (dh - iconSize) / 2;
         }

         ctx.drawImage(logoImg, dx, dy, dw, dh);
         ctx.restore();
    } else {
         const socialDrawn = drawSocialLogo(ctx, config, iconX, iconY, iconSize);
         if (!socialDrawn) {
            ctx.fillStyle = config.primaryColor;
            ctx.beginPath();
            ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            const cx = iconX + iconSize/2;
            const cy = iconY + iconSize/2;
            const s = iconSize * 0.5;
            
            ctx.fillStyle = '#000000';
            const bodyW = s;
            const bodyH = s * 0.7;
            roundRect(ctx, cx - bodyW/2, cy - bodyH/2 + s*0.1, bodyW, bodyH, s*0.15);
            ctx.fill();
            
            const bumpW = s * 0.5;
            const bumpH = s * 0.2;
            ctx.fillRect(cx - bumpW/2, cy - bodyH/2 - bumpH/2 + s*0.1, bumpW, bumpH);
            
            ctx.strokeStyle = config.primaryColor;
            ctx.lineWidth = s * 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy + s*0.1, s*0.25, 0, Math.PI*2);
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx + bodyW*0.35, cy - bodyH*0.35 + s*0.1, s*0.08, 0, Math.PI*2);
            ctx.fill();
         }
    }
}

// ... (Social Logo Engine and helpers remain unchanged) ...
function drawSocialLogo(ctx: CanvasRenderingContext2D, config: CardConfig, x: number, y: number, size: number): boolean {
    const url = (config.targetUrl || '').toLowerCase();
    const type = config.linkType;

    // 1. Instagram
    if (url.includes('instagram.com')) {
        const grad = ctx.createLinearGradient(x, y + size, x + size, y);
        grad.addColorStop(0, '#f09433'); 
        grad.addColorStop(0.25, '#e6683c'); 
        grad.addColorStop(0.5, '#dc2743'); 
        grad.addColorStop(0.75, '#cc2366'); 
        grad.addColorStop(1, '#bc1888');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        const pad = size * 0.25;
        roundRect(ctx, x + pad, y + pad, size - pad*2, size - pad*2, 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size * 0.15, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + size - pad - 10, y + pad + 10, 3, 0, Math.PI*2);
        ctx.fill();
        return true;
    }

    // 2. TikTok
    if (url.includes('tiktok.com')) {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        const noteSize = size * 0.5;
        ctx.font = `bold ${noteSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#25F4EE';
        ctx.fillText('♪', x + size/2 - 3, y + size/2 + size*0.15 - 3);
        ctx.fillStyle = '#FE2C55';
        ctx.fillText('♪', x + size/2 + 3, y + size/2 + size*0.15 + 3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('♪', x + size/2, y + size/2 + size*0.15);
        
        return true;
    }

    // 3. YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const cx = x + size/2;
        const cy = y + size/2;
        const s = size * 0.2;
        ctx.moveTo(cx - s/2, cy - s);
        ctx.lineTo(cx + s, cy);
        ctx.lineTo(cx - s/2, cy + s);
        ctx.fill();
        return true;
    }
    
    // 4. X (Twitter)
    if (url.includes('x.com') || url.includes('twitter.com')) {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        const cx = x + size/2;
        const cy = y + size/2;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.font = `bold ${size * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('𝕏', 0, 2); 
        ctx.restore();
        
        return true;
    }

    // 5. WhatsApp
    if (type === LinkType.WHATSAPP || url.includes('wa.me')) {
        ctx.fillStyle = '#25D366';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size * 0.22, 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + size/2 - size*0.15, y + size/2 - size*0.1, size*0.08, 0, Math.PI*2);
        ctx.arc(x + size/2 + size*0.15, y + size/2 + size*0.1, size*0.08, 0, Math.PI*2);
        ctx.fill();
        
        return true;
    }

    // 6. Telegram
    if (type === LinkType.TELEGRAM || url.includes('t.me')) {
        ctx.fillStyle = '#229ED9';
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const cx = x + size/2;
        const cy = y + size/2;
        ctx.moveTo(cx - size*0.2, cy + size*0.1);
        ctx.lineTo(cx + size*0.25, cy - size*0.2);
        ctx.lineTo(cx + size*0.25, cy + size*0.15);
        ctx.lineTo(cx, cy);
        ctx.fill();
        return true;
    }

    // 7. Messenger
    if (type === LinkType.MESSENGER || url.includes('m.me')) {
        const grad = ctx.createLinearGradient(x, y + size, x + size, y);
        grad.addColorStop(0, '#00C6FF');
        grad.addColorStop(1, '#0072FF');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const cx = x + size/2;
        const cy = y + size/2;
        const s = size * 0.15;
        ctx.moveTo(cx - s, cy + s);
        ctx.lineTo(cx, cy - s);
        ctx.lineTo(cx + s, cy - s*2);
        ctx.lineTo(cx + s/2, cy);
        ctx.lineTo(cx - s/2, cy + s*2);
        ctx.fill();
        return true;
    }

    return false;
}

function drawBadge(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, font: string) {
    ctx.font = font;
    const metrics = ctx.measureText(text.toUpperCase());
    const padX = 30;
    const padY = 15;
    const h = 60;
    const w = metrics.width + (padX * 2);
    
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = color;
    ctx.transform(1, 0, -0.2, 1, 0, 0);
    ctx.fillRect(x + 10, y, w, h);
    
    ctx.transform(1, 0, 0.2, 1, 0, 0); // Reset skew for text
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), x + (w/2), y + (h/2) + 2);
    ctx.restore();
}

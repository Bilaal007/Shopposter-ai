import { LayoutMode, AnchorPoint, Position, SafeZone, CardConfig, LinkType, QRCodePlacement, PlatformType } from '../types';

// Fixed width for all layouts
const CANVAS_WIDTH = 1080;

// Height mapping for different layout modes
const LAYOUT_HEIGHTS = {
  [LayoutMode.SQUARE]: 1080, // 1:1
  [LayoutMode.FEED]: 1350,   // 4:5
  [LayoutMode.STORY]: 1920   // 9:16
};

// Default safe zones (5% margin)
const DEFAULT_SAFE_ZONE: SafeZone = {
  top: 0.05,
  right: 0.05,
  bottom: 0.05,
  left: 0.05
};

/**
 * Calculate the canvas dimensions based on layout mode
 */
export function getCanvasDimensions(layoutMode: LayoutMode = LayoutMode.FEED) {
  return {
    width: CANVAS_WIDTH,
    height: LAYOUT_HEIGHTS[layoutMode] || LAYOUT_HEIGHTS[LayoutMode.FEED]
  };
}

/**
 * Convert a Position object to actual canvas coordinates
 */
export function getAbsolutePosition(
  position: Position,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const { x, y, anchor, offsetX = 0, offsetY = 0 } = position;
  
  // Calculate base position based on anchor point
  let baseX = x * canvasWidth;
  let baseY = y * canvasHeight;
  
  // Apply anchor point offset
  switch (anchor) {
    case AnchorPoint.TOP_LEFT:
      // No adjustment needed for top-left
      break;
    case AnchorPoint.TOP_CENTER:
      baseX = canvasWidth / 2;
      break;
    case AnchorPoint.TOP_RIGHT:
      baseX = canvasWidth;
      break;
    case AnchorPoint.CENTER_LEFT:
      baseY = canvasHeight / 2;
      break;
    case AnchorPoint.CENTER:
      baseX = canvasWidth / 2;
      baseY = canvasHeight / 2;
      break;
    case AnchorPoint.CENTER_RIGHT:
      baseX = canvasWidth;
      baseY = canvasHeight / 2;
      break;
    case AnchorPoint.BOTTOM_LEFT:
      baseY = canvasHeight;
      break;
    case AnchorPoint.BOTTOM_CENTER:
      baseX = canvasWidth / 2;
      baseY = canvasHeight;
      break;
    case AnchorPoint.BOTTOM_RIGHT:
      baseX = canvasWidth;
      baseY = canvasHeight;
      break;
  }
  
  // Apply the position offset (0-1 range) and any additional pixel offset
  return {
    x: baseX + (x * canvasWidth) + offsetX,
    y: baseY + (y * canvasHeight) + offsetY
  };
}

/**
 * Ensure a position stays within safe zone boundaries
 */
export function ensureSafePosition(
  position: Position,
  elementWidth: number,
  elementHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  safeZone: SafeZone = DEFAULT_SAFE_ZONE
): Position {
  const { x, y, anchor } = position;
  
  // Calculate min/max bounds based on element size and safe zone
  const minX = (elementWidth / 2 + safeZone.left * canvasWidth) / canvasWidth;
  const maxX = 1 - (elementWidth / 2 + safeZone.right * canvasWidth) / canvasWidth;
  const minY = (elementHeight / 2 + safeZone.top * canvasHeight) / canvasHeight;
  const maxY = 1 - (elementHeight / 2 + safeZone.bottom * canvasHeight) / canvasHeight;
  
  // Clamp values to stay within bounds
  const safeX = Math.max(minX, Math.min(maxX, x));
  const safeY = Math.max(minY, Math.min(maxY, y));
  
  return {
    ...position,
    x: safeX,
    y: safeY
  };
}

/**
 * Initialize default positions for a new card
 */
export function getDefaultPositions(layoutMode: LayoutMode): Record<string, Position> {
  const { height: canvasHeight } = getCanvasDimensions(layoutMode);
  const isStory = layoutMode === LayoutMode.STORY;
  
  return {
    headline: {
      x: 0.5,
      y: isStory ? 0.2 : 0.15,
      anchor: isStory ? AnchorPoint.TOP_CENTER : AnchorPoint.CENTER_LEFT,
      offsetX: isStory ? 0 : 60,
      offsetY: 0
    },
    cta: {
      x: 0.5,
      y: isStory ? 0.85 : 0.8,
      anchor: isStory ? AnchorPoint.BOTTOM_CENTER : AnchorPoint.CENTER,
      offsetX: 0,
      offsetY: 0
    },
    qr: {
      x: isStory ? 0.9 : 0.5,
      y: isStory ? 0.9 : 0.9,
      anchor: isStory ? AnchorPoint.BOTTOM_RIGHT : AnchorPoint.BOTTOM_CENTER,
      offsetX: isStory ? -40 : 0,
      offsetY: isStory ? -40 : 0
    },
    logo: {
      x: 0.5,
      y: 0.1,
      anchor: AnchorPoint.TOP_CENTER,
      offsetX: 0,
      offsetY: 20
    },
    badge: {
      x: 0.1,
      y: 0.1,
      anchor: AnchorPoint.TOP_LEFT,
      offsetX: 20,
      offsetY: 20
    }
  };
}

/**
 * Initialize a new card config with default values
 */
export function createDefaultCardConfig(overrides: Partial<CardConfig> = {}): CardConfig {
  const layoutMode = overrides.layoutMode || LayoutMode.FEED;
  const defaultPositions = getDefaultPositions(layoutMode);
  
  return {
    id: Date.now().toString(),
    timestamp: Date.now(),
    platform: PlatformType.NONE, // Default platform
    imageSrc: '',
    linkType: LinkType.URL,
    targetUrl: '',
    title: 'Your Headline Here',
    cta: 'Shop Now',
    showQr: true,
    primaryColor: '#4F46E5',
    secondaryColor: '#8B5CF6',
    backgroundColor: '#1F2937',
    backgroundGradient: ['#1F2937', '#111827'],
    fontFamily: 'Inter',
    placement: QRCodePlacement.CARD_BOTTOM,
    layoutMode,
    safeZone: { ...DEFAULT_SAFE_ZONE },
    
    // Apply default positions
    headlinePosition: defaultPositions.headline,
    ctaPosition: defaultPositions.cta,
    qrPosition: defaultPositions.qr,
    logoPosition: defaultPositions.logo,
    badgePosition: defaultPositions.badge,
    
    // Apply any overrides last
    ...overrides
  };
}



export enum AppState {
  ONBOARDING = 'ONBOARDING',
  PERMISSIONS = 'PERMISSIONS', // New Permission Page
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  SCENE_SELECTION = 'SCENE_SELECTION',
  EDITOR = 'EDITOR',
  HISTORY = 'HISTORY'
}

export enum LayoutMode {
  SQUARE = 'square',    // 1:1 (1080x1080)
  FEED = 'feed',        // 4:5 (1080x1350)
  STORY = 'story'       // 9:16 (1080x1920)
}

export enum PlatformType {
  TIKTOK = 'tiktok',
  REELS = 'reels',
  NONE = 'none'
}

export enum AnchorPoint {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  TOP_RIGHT = 'top-right',
  CENTER_LEFT = 'center-left',
  CENTER = 'center',
  CENTER_RIGHT = 'center-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_RIGHT = 'bottom-right'
}

export interface Position {
  x: number; // 0-1 representing percentage of width
  y: number; // 0-1 representing percentage of height
  anchor: AnchorPoint;
  offsetX?: number; // pixels to offset from anchor
  offsetY?: number; // pixels to offset from anchor
}

export interface SafeZone {
  top: number;    // percentage (0-1)
  right: number;  // percentage (0-1)
  bottom: number; // percentage (0-1)
  left: number;   // percentage (0-1)
}

export enum QRCodePlacement {
  CARD_BOTTOM = 'card-bottom', // Standard layout
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right'
}

export enum HeadlinePlacement {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  CENTER = 'center',
  BOTTOM_LEFT = 'bottom-left'
}

export enum LinkType {
  URL = 'url',
  PAYPAL = 'paypal',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  MESSENGER = 'messenger',
  EMAIL = 'email'
}

export enum ProductCategory {
  CLOTHING = 'Clothing',
  FOOD = 'Food',
  ELECTRONICS = 'Electronics',
  HOME = 'Home Goods',
  BEAUTY = 'Beauty',
  JEWELRY = 'Jewelry',
  SPORTS = 'Sports',
  OTHER = 'Other'
}

export type FontFamily = 'Inter' | 'Anton' | 'Playfair Display';

export interface SceneVariation {
  id: string;
  url: string;
  label: string;
  isOriginal: boolean;
}

export interface SceneIdea {
  label: string;
  prompt: string;
}

export interface DetailBubble {
  id: string;
  src: string;
  x: number;
  y: number;
}

export interface ProductAnalysis {
  // Core fields for UI
  category: ProductCategory;
  title: string;
  cta: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  backgroundGradient: [string, string]; // New: Dynamic Gradients
  suggestedPlacement: string;
  
  // Master Prompt Extras
  description?: string;
  scene_ideas: SceneIdea[];
  remixSuggestion?: string; // New: AI Context-aware prompt suggestion
  layout_mode: 'card' | 'poster';
  font_family: FontFamily; // New: Font selection
  badge_text?: string; // New: Hype badge
  typography?: {
    headline_color: string;
    headline_placement: HeadlinePlacement; // New: AI positioning
    cta_color: string;
    cta_bg: string;
  };
}

export interface UserProfile {
  id: string;
  hasOnboarded: boolean; // New
  credits: number; // New
  isPremium: boolean; // New
  shopName?: string; // New
  brandColors: string[]; // New: Array of 3 hex codes
  defaultLinkType: LinkType;
  defaultUrl: string;
  paypalUser: string;
  waNumber: string;
  waMessage: string;
  telegramUser: string;
  messengerUser: string;
  emailAddr: string;
  instagramUser?: string; // New
  tiktokUser?: string; // New
  youtubeUser?: string; // New
  twitterUser?: string; // New
  logoSrc?: string; // Base64 logo
  referralCode: string;
  lastReferralShare?: number;
  referredRecipients: string[];
}

export interface MarketingCopy {
  caption: string;
  hashtags: string[];
  platform: PlatformType;
  tone: 'casual' | 'professional' | 'playful' | 'urgent';
  characterCount: number;
}

export interface CardConfig {
  id: string;
  timestamp: number;
  platform: PlatformType;
  imageSrc: string;
  originalImageSrc?: string;
  
  // Layout Configuration
  layoutMode?: LayoutMode;
  safeZone?: SafeZone;
  
  // Element Positions
  headlinePosition?: Position;
  ctaPosition?: Position;
  qrPosition?: Position;
  logoPosition?: Position;
  badgePosition?: Position;
  
  linkType: LinkType;
  targetUrl: string;
  linkData?: {
    paypalUser?: string;
    paypalAmount?: string;
    waNumber?: string;
    waMessage?: string;
    telegramUser?: string;
    messengerUser?: string;
    emailAddr?: string;
  };
  title: string;
  headlineColor?: string; // New: Custom Headline Color
  headlinePlacement?: HeadlinePlacement; // New
  headlineYOffset?: number; // New: Vertical Drag for Headline
  cta: string;
  ctaColor?: string; // New: Custom CTA Text Color
  price?: string;
  priceColor?: string; // New: Custom Price Color
  badgeText?: string;
  badgeColor?: string; // Custom Badge Background Color
  showQr: boolean;
  showActionCard?: boolean; // New: Toggle the whole pill in poster mode
  showFloatingLogo?: boolean; // New: Toggle floating brand logo
  
  detailBubbles?: DetailBubble[]; // New: Array of detail bubbles (max 3)

  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  backgroundGradient: [string, string]; // New
  fontFamily: FontFamily; // New
  placement: QRCodePlacement;
  qrLogoSrc?: string;
  logoSrc?: string; // Custom brand logo for the action button
  overlayYOffset?: number; // Vertical offset for the overlay content (Poster mode)
  
  // Layout dimensions (auto-calculated, read-only)
  canvasWidth?: number;
  canvasHeight?: number;
  
  // AI-Generated Marketing Content
  marketingCopy?: MarketingCopy;
}
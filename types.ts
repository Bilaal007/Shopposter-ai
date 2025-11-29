

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

export interface CardConfig {
  id: string;
  timestamp: number;
  imageSrc: string;
  originalImageSrc?: string; // Keep track of the original upload
  linkType: LinkType;
  targetUrl: string; // The final computed URL
  // Metadata for link builders
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
  badgeText?: string; // New
  badgeColor?: string; // New: Custom Badge Background Color
  badgePosition?: 'left' | 'right'; // New: Toggle badge side
  showQr: boolean;
  showActionCard?: boolean; // New: Toggle the whole pill in poster mode
  showFloatingLogo?: boolean; // New: Toggle floating brand logo
  logoPosition?: { x: number, y: number }; // New: X/Y coordinates for floating logo
  
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
}
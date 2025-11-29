

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera as CameraIcon, Download, RefreshCcw, Link as LinkIcon, Sparkles, Layout, Palette, DollarSign, MessageCircle, Mail, Clock, Trash2, Image as ImageIcon, ChevronLeft, Zap, Check, Loader2, Settings, Key, X, Aperture, Eye, EyeOff, Type, Star, Share2, Flashlight, User, Briefcase, Save, ExternalLink, Smile, GripHorizontal, Layers, Send, Instagram, Youtube, Twitter, Wand2, Mic, Crown, ArrowRight, ArrowLeftRight, ZoomIn, AudioLines, Plus, Bell, Lock, Gift, Network } from 'lucide-react';
import { supabase } from './services/supabase';
import {
  generateReferralCode,
  trackReferral,
  verifyReferral,
  buildReferralSharePayload,
} from './services/referralService';
import { nextReferralEligibleTime } from './utils/referral';
import { QRCodeCanvas } from 'qrcode.react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { StatusBar, Style } from '@capacitor/status-bar';
import { analyzeProductImage, generateLifestyleScenes, setStoredApiKey, clearStoredApiKey, getApiKey } from './services/gemini';
import { generateCardImage } from './components/CardGenerator';
import { AppState, ProductAnalysis, CardConfig, QRCodePlacement, LinkType, SceneVariation, ProductCategory, FontFamily, UserProfile, HeadlinePlacement, DetailBubble } from './types';
import { getHistory, saveHistoryItem, deleteHistoryItemDB, getUserProfile, saveUserProfile } from './utils/storage';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// --- HELPERS ---
const triggerHaptic = () => {
  try { if (navigator.vibrate) navigator.vibrate(10); } catch(e) {}
};

const triggerDownload = (file: File) => {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Hype": ["🔥", "✨", "⚡", "🚀", "💎", "👑", "💯", "🆕", "🚨", "📣", "📢", "💥", "🎯", "🏆", "🎁", "💣", "🧨", "🎈", "🎉", "🎊"],
  "Shop": ["🛒", "🛍️", "💸", "💵", "💶", "💳", "💲", "🏷️", "🧾", "📦", "🚚", "🤝", "🏦", "💼", "📈", "📉", "📊", "👜", "👛", "👢"],
  "Action": ["👇", "👉", "👆", "👈", "👀", "📲", "📞", "📩", "✅", "☑️", "✔", "❌", "🏃", "🏎️", "⏳", "⏰", "📅", "📍", "🔗", "🔎"],
  "Vibe": ["😎", "🤩", "🤯", "😍", "🥰", "🤑", "🤔", "🤫", "🤭", "🥳", "🤠", "💀", "👻", "👽", "🤖", "🫶", "🙌", "👏", "💪", "🙏"],
  "Product": ["📱", "💻", "⌚", "📷", "🎧", "👟", "👕", "👗", "💍", "💄", "🕶️", "🎒", "🏠", "🚗", "✈️", "🚲", "🎮", "🧸", "⚽", "🎵"],
  "Color": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💖", "💗", "💗", "💗", "💕", "🔴", "🟠", "🟡", "🟢", "🔵"]
};

// --- UI COMPONENTS ---

const BrainCameraLogo = ({ size = "w-10 h-10", animated = true }) => (
  <div className={`${size} relative ${animated ? 'animate-jelly' : ''}`}>
    {/* Camera Body */}
    <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gold-500 rounded-lg border-2 border-black z-10 flex items-center justify-center shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
        {/* The "Brain" Lens */}
        <div className="w-2/3 h-2/3 bg-black rounded-full border-[2px] border-white/20 relative flex items-center justify-center overflow-hidden">
            <Network className="w-3/4 h-3/4 text-gold-500" /> 
            {/* Gloss */}
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
        </div>
    </div>
    {/* Flash / Top Deck */}
    <div className="absolute top-[10%] left-[15%] w-[30%] h-[20%] bg-black rounded-t-md border-2 border-b-0 border-gold-500"></div>
    <div className={`absolute top-0 right-[10%] w-[20%] h-[20%] bg-white rounded-full border-2 border-black z-0 ${animated ? 'animate-pulse' : ''}`}></div>
    
    {/* Circuit Lines (Decor) */}
    <div className="absolute -left-2 top-1/2 w-2 h-[2px] bg-gold-500"></div>
    <div className="absolute -right-2 top-1/2 w-2 h-[2px] bg-gold-500"></div>
  </div>
);

// New Background Texture (Electric Yellow Fence Scanning)
const CircuitBackground = () => (
    <div className="absolute inset-0 z-0 pointer-events-none bg-dark-950 overflow-hidden">
        {/* Yellow Electric Grid (The Fence) */}
        <div className="absolute inset-0 opacity-10"
             style={{
                 backgroundImage: `linear-gradient(#FFE600 1px, transparent 1px), linear-gradient(90deg, #FFE600 1px, transparent 1px)`,
                 backgroundSize: '40px 40px',
                 maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
             }}>
        </div>

        {/* Scanning Beam (Moves Up) */}
        <div className="absolute inset-x-0 h-[150px] bg-gradient-to-t from-transparent via-gold-500/20 to-transparent animate-scan-up blur-xl"></div>
        <div className="absolute inset-x-0 h-[2px] bg-gold-500/50 animate-scan-up blur-[1px]"></div>
    </div>
);

const EmojiInput = ({ value, onChange, placeholder, fontClass = "" }: { value: string, onChange: (val: string) => void, placeholder?: string, fontClass?: string }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Hype");
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{top?: number, bottom?: number, left: number}>({ left: 0 });
  
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowPicker(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (showPicker && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceAbove = rect.top;
            if (spaceAbove > 300) {
                 setPosition({
                     bottom: window.innerHeight - rect.top + 8,
                     left: Math.max(10, Math.min(rect.left, window.innerWidth - 300))
                 });
            } else {
                 setPosition({
                     top: rect.bottom + 8,
                     left: Math.max(10, Math.min(rect.left, window.innerWidth - 300))
                 });
            }
        }
    }, [showPicker]);
  
    return (
      <div ref={containerRef} className="relative group">
         <input 
           type="text" 
           inputMode="text"
           enterKeyHint="done"
           autoComplete="off"
           autoCorrect="off"
           style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
           value={value} 
           onChange={(e) => onChange(e.target.value)}
           placeholder={placeholder}
           className={`w-full bg-black border border-dark-700 rounded-xl px-4 py-3 pr-10 text-white focus:border-gold-500 outline-none text-sm transition-colors caret-gold-500 select-text ${fontClass}`}
         />
         <button 
           onClick={() => { triggerHaptic(); setShowPicker(!showPicker); }}
           className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showPicker ? 'text-gold-500' : 'text-neutral-500 hover:text-white'}`}
         >
           <Smile className="w-4 h-4" />
         </button>
         
         {showPicker && (
           <div 
             className="fixed z-[100] bg-dark-800 border border-white/10 rounded-xl shadow-xl w-72 animate-bounce-in overflow-hidden flex flex-col"
             style={{ 
                 top: position.top, 
                 bottom: position.bottom, 
                 left: position.left 
             }}
           >
              <div className="p-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                {EMOJI_CATEGORIES[activeCategory].map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => { triggerHaptic(); onChange(value + emoji); }}
                    className="hover:bg-white/10 rounded p-1 text-lg active:scale-90 transition-transform aspect-square flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              <div className="flex bg-black/50 border-t border-white/5 overflow-x-auto no-scrollbar shrink-0">
                  {Object.keys(EMOJI_CATEGORIES).map(cat => (
                      <button
                        key={cat}
                        onClick={() => { triggerHaptic(); setActiveCategory(cat); }}
                        className={`px-3 py-2 text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${activeCategory === cat ? 'text-gold-500 bg-white/5' : 'text-neutral-500'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
           </div>
         )}
      </div>
    );
  };

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  // State Definitions
  const [state, setState] = useState<AppState>(AppState.UPLOAD);
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'qr'>('design');
  const [imageSrc, setImageSrc] = useState<string>("");
  const [originalImageSrc, setOriginalImageSrc] = useState<string>("");
  const [detectedCategory, setDetectedCategory] = useState<ProductCategory | null>(null);
  const [generatedScenes, setGeneratedScenes] = useState<SceneVariation[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>('original');
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixPrompt, setRemixPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState<{type: string} | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [referralOpen, setReferralOpen] = useState(false);
  const [savedSceneIds, setSavedSceneIds] = useState<string[]>([]); 
  const [savingSceneIds, setSavingSceneIds] = useState<string[]>([]); 
  const [analysisData, setAnalysisData] = useState<ProductAnalysis | null>(null);
  
  const [config, setConfig] = useState<Partial<CardConfig>>({
    linkType: LinkType.URL,
    targetUrl: "https://your-shop.com",
    title: "",
    headlineColor: "#ffffff",
    headlinePlacement: HeadlinePlacement.BOTTOM_LEFT,
    headlineYOffset: 0,
    cta: "",
    ctaColor: "",
    price: "",
    priceColor: "",
    badgeText: "",
    badgeColor: "",
    badgePosition: 'left',
    showQr: true,
    showActionCard: true,
    showFloatingLogo: false,
    detailBubbles: [], 
    primaryColor: "#FFE600", 
    secondaryColor: "#121212", 
    backgroundColor: "#ffffff", 
    backgroundGradient: ["#1a1a1a", "#000000"],
    fontFamily: 'Inter',
    placement: QRCodePlacement.BOTTOM_RIGHT,
    overlayYOffset: 0,
    linkData: {
      paypalUser: "",
      paypalAmount: "",
      waNumber: "",
      waMessage: "Hi, I'd like to order...",
      telegramUser: "",
      messengerUser: "",
      emailAddr: ""
    }
  });

  const [history, setHistory] = useState<CardConfig[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'api'>('profile');
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [secretKnockCount, setSecretKnockCount] = useState(0);

  const [userProfile, setUserProfile] = useState<UserProfile>({
      id: '',
      hasOnboarded: false,
      credits: 5,
      isPremium: false,
      shopName: "",
      brandColors: ['#FFE600', '#FFFFFF', '#000000'],
      defaultLinkType: LinkType.URL,
      defaultUrl: "",
      paypalUser: "",
      waNumber: "",
      waMessage: "",
      telegramUser: "",
      messengerUser: "",
      emailAddr: "",
      instagramUser: "",
      tiktokUser: "",
      youtubeUser: "",
      twitterUser: "",
      referralCode: '',
      lastReferralShare: undefined,
      referredRecipients: [],
    });

  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null); 
  const recognitionRef = useRef<any>(null);
  
  const dragStartY = useRef<number | null>(null);
  const initialOffset = useRef<number>(0);
  const headlineDragStartY = useRef<number | null>(null);
  const headlineInitialOffset = useRef<number>(0);
  const logoDragStart = useRef<{x: number, y: number} | null>(null);
  const initialLogoPos = useRef<{x: number, y: number} | null>(null);
  
  const activeBubbleId = useRef<string | null>(null);
  const detailDragStart = useRef<{x: number, y: number} | null>(null);
  const initialDetailPos = useRef<{x: number, y: number} | null>(null); 
  const lastTap = useRef<{id: string, time: number} | null>(null);

  // ... Effects ...
  useEffect(() => {
      const configureStatusBar = async () => {
          try {
            await StatusBar.setOverlaysWebView({ overlay: true });
            await StatusBar.setStyle({ style: Style.Dark });
          } catch (e) { }
      };
      configureStatusBar();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const saved = await getHistory();
      setHistory(saved);
      const profile = getUserProfile();
      const normalizedProfile = ensureReferralMetadata(profile);
      if (normalizedProfile !== profile) {
        saveUserProfile(normalizedProfile);
      }
      setUserProfile(normalizedProfile);
      await syncReferralProfile(normalizedProfile);
      if (!normalizedProfile.hasOnboarded) setState(AppState.ONBOARDING);
  };
    loadData();
    try {
        const key = getApiKey();
        if (key && !process.env.API_KEY) setApiKeyInput(key);
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (!settingsOpen) setSecretKnockCount(0);
  }, [settingsOpen]);

  useEffect(() => {
    if (state === AppState.HISTORY) getHistory().then(setHistory);
  }, [state]);

  // ... Helpers ...
  const computedUrl = (() => {
    const { linkType, targetUrl, linkData } = config;
    if (!linkData) return targetUrl || "";
    switch (linkType) {
      case LinkType.PAYPAL:
        if (!linkData.paypalUser) return "https://paypal.me";
        return `https://paypal.me/${linkData.paypalUser}${linkData.paypalAmount ? '/' + linkData.paypalAmount : ''}`;
      case LinkType.WHATSAPP:
        if (!linkData.waNumber) return "https://wa.me";
        const cleanNum = linkData.waNumber.replace(/\D/g,'');
        const text = encodeURIComponent(linkData.waMessage || "");
        return `https://wa.me/${cleanNum}?text=${text}`;
      case LinkType.TELEGRAM:
        if (!linkData.telegramUser) return "https://t.me";
        return `https://t.me/${linkData.telegramUser.replace('@', '')}`;
      case LinkType.MESSENGER:
        if (!linkData.messengerUser) return "https://m.me";
        return `https://m.me/${linkData.messengerUser}`;
      case LinkType.EMAIL:
        return `mailto:${linkData.emailAddr}`;
      default:
        return targetUrl || "";
    }
  })();

  const ensureReferralMetadata = (profile: UserProfile): UserProfile => {
    let changed = false;
    const updated = { ...profile };

    if (!updated.id) {
      updated.id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      changed = true;
    }

    if (!updated.referralCode) {
      updated.referralCode = generateReferralCode(updated.id);
      changed = true;
    }

    if (!Array.isArray(updated.referredRecipients)) {
      updated.referredRecipients = [];
      changed = true;
    }

    return changed ? updated : profile;
  };

  const syncReferralProfile = async (profile: UserProfile) => {
    if (!profile.id) return;
    try {
      const { error } = await supabase
        .from('users')
        .upsert(
          {
            id: profile.id,
            credits: profile.credits,
            referral_code: profile.referralCode,
          },
          { onConflict: 'id' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync referral profile:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSecretKnock = () => {
    if (devModeEnabled) return;
    const newCount = secretKnockCount + 1;
    setSecretKnockCount(newCount);
    if (newCount >= 5) {
        triggerHaptic();
        setDevModeEnabled(true);
        showNotification("👨‍💻 Developer Mode Unlocked", 'success');
    }
  };

  const handleSaveApiKey = () => {
    triggerHaptic();
    if (!apiKeyInput.trim()) return;
    setStoredApiKey(apiKeyInput.trim());
    setSettingsOpen(false);
    showNotification("API Key saved", 'success');
  };

  const handleSaveProfile = () => {
    triggerHaptic();
    saveUserProfile(userProfile);
    setSettingsOpen(false);
    showNotification("Profile updated", 'success');
  };
  
  const completeOnboarding = () => {
      triggerHaptic();
      if (!userProfile.shopName) {
          showNotification("Please enter your shop name", "error");
          return;
      }
      const updated = { ...userProfile, hasOnboarded: true };
      setUserProfile(updated);
      saveUserProfile(updated);
      setState(AppState.PERMISSIONS);
  };
  
  const requestPermissionsAndContinue = async () => {
    triggerHaptic();
    try {
        await Camera.requestPermissions();
    } catch (e: any) {
        if (e?.message !== 'Not implemented on web') {
            console.error("Permission request failed or not needed", e);
        }
    } finally {
        setState(AppState.UPLOAD);
        showNotification("Ready to create!", "success");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userProfile.isPremium) {
        setPremiumModalOpen({type: 'Brand Logo'});
        e.target.value = ''; 
        return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setUserProfile(p => ({...p, logoSrc: res}));
        if (state === AppState.EDITOR) {
          setConfig(c => ({...c, logoSrc: res}));
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleClearApiKey = () => {
    triggerHaptic();
    clearStoredApiKey();
    setApiKeyInput("");
    showNotification("API Key removed", 'success');
  };

  const addDetailBubble = (src: string) => {
      triggerHaptic();
      if (!userProfile.isPremium) {
          setPremiumModalOpen({type: 'Bubbles'});
          return;
      }
      if ((config.detailBubbles?.length || 0) >= 3) {
          showNotification("Max 3 bubbles", "error");
          return;
      }
      const newBubble: DetailBubble = {
          id: Date.now().toString() + Math.random(),
          src: src,
          x: 1080/2 - 105, 
          y: 1350/2 - 300
      };
      setConfig(c => ({
          ...c,
          detailBubbles: [...(c.detailBubbles || []), newBubble]
      }));
  };

  const handleDetailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const res = reader.result as string;
              addDetailBubble(res);
          };
          reader.readAsDataURL(file);
      }
      e.target.value = ''; 
  };

  // ... (handleFile, takeNativePhoto, etc. - unchanged) ...
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showNotification("Please upload a valid image file.", 'error');
      return;
    }
    
    triggerHaptic();
    const url = URL.createObjectURL(file);
    setOriginalImageSrc(url);
    setImageSrc(url); 
    setSavedSceneIds([]); 
    setSavingSceneIds([]);
    
    setState(AppState.ANALYZING);
    
    try {
      const analysis = await analyzeProductImage(file);
      setAnalysisData(analysis);
      setDetectedCategory(analysis.category);
      
      let placement = QRCodePlacement.BOTTOM_RIGHT; 
      if (analysis.layout_mode === 'card') {
        placement = QRCodePlacement.BOTTOM_RIGHT;
      }

      const currentProfile = getUserProfile();
      const hasCredits = currentProfile.credits > 0;
      
      if (hasCredits) {
          const newCredits = Math.max(0, currentProfile.credits - 1);
          setUserProfile(p => ({...p, credits: newCredits}));
          saveUserProfile({...currentProfile, credits: newCredits});
      } else {
          showNotification("Standard Mode (No AI Background)", "success");
      }
      
      const shouldUseDefaults = currentProfile.isPremium;
      
      setConfig(prev => ({
        ...prev,
        title: analysis.title,
        cta: analysis.cta,
        price: "",
        badgeText: analysis.badge_text,
        badgePosition: 'left',
        showQr: true,
        showActionCard: true,
        showFloatingLogo: false,
        detailBubbles: [],
        primaryColor: analysis.primaryColor,
        secondaryColor: analysis.secondaryColor,
        backgroundColor: analysis.backgroundColor,
        backgroundGradient: analysis.backgroundGradient,
        headlineColor: analysis.typography?.headline_color || "#ffffff",
        headlinePlacement: analysis.typography?.headline_placement || HeadlinePlacement.BOTTOM_LEFT,
        headlineYOffset: 0,
        fontFamily: analysis.font_family,
        placement: placement,
        overlayYOffset: 0,
        linkType: shouldUseDefaults ? currentProfile.defaultLinkType : LinkType.URL,
        targetUrl: shouldUseDefaults ? (currentProfile.defaultUrl || "https://your-shop.com") : "https://your-shop.com",
        logoSrc: shouldUseDefaults ? currentProfile.logoSrc : undefined,
        linkData: shouldUseDefaults ? {
            paypalUser: currentProfile.paypalUser,
            paypalAmount: "",
            waNumber: currentProfile.waNumber,
            waMessage: currentProfile.waMessage || "Hi, I'd like to order...",
            telegramUser: currentProfile.telegramUser,
            messengerUser: currentProfile.messengerUser,
            emailAddr: currentProfile.emailAddr
        } : {
            paypalUser: "",
            paypalAmount: "",
            waNumber: "",
            waMessage: "Hi, I'd like to order...",
            telegramUser: "",
            messengerUser: "",
            emailAddr: ""
        }
      }));

      if (hasCredits) {
          setState(AppState.GENERATING);
          const scenes = await generateLifestyleScenes(
              file, 
              analysis.category, 
              analysis.description || "product",
              analysis.scene_ideas 
          );
          
          const allScenes: SceneVariation[] = [
            { id: 'original', url: url, label: 'Original Photo', isOriginal: true },
            ...scenes
          ];
          
          setGeneratedScenes(allScenes);
          setSelectedSceneId(scenes.length > 0 ? scenes[0].id : 'original');
          
          setState(AppState.SCENE_SELECTION);
      } else {
          const allScenes: SceneVariation[] = [
            { id: 'original', url: url, label: 'Original Photo', isOriginal: true }
          ];
          setGeneratedScenes(allScenes);
          setSelectedSceneId('original');
          setImageSrc(url);
          setState(AppState.EDITOR);
      }

    } catch (err: any) {
      console.error(err);
      if (err.message === 'MISSING_API_KEY') {
        setSettingsOpen(true);
        setSettingsTab('api');
        setState(AppState.UPLOAD); 
        return;
      }

      // NEW: Alert for debugging specific API errors on mobile
      alert(`AI Error: ${err.message}`);

      if (err.message.includes('CONTENT_VIOLATION')) {
          const reason = err.message.split('CONTENT_VIOLATION:')[1] || 'Prohibited content detected.';
          showNotification(`⚠️ Upload Rejected: ${reason.trim()}`, 'error');
          setState(AppState.UPLOAD);
          return;
      }
      showNotification("AI processing failed. Switching to manual mode.", 'error');
      setState(AppState.EDITOR);
    }
  };

  const takeNativePhoto = async () => {
    triggerHaptic();
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera
        });

        if (image.webPath) {
            const response = await fetch(image.webPath);
            const blob = await response.blob();
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            handleFile(file);
        }
    } catch (err: any) {
        if (err?.message !== 'User cancelled photos app' && err?.message !== 'Not implemented on web') {
             // ignore
        }
    }
  };

  const pickFromGallery = async () => {
    triggerHaptic();
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Photos
        });

        if (image.webPath) {
            const response = await fetch(image.webPath);
            const blob = await response.blob();
            const file = new File([blob], "gallery-image.jpg", { type: "image/jpeg" });
            handleFile(file);
        }
    } catch (err: any) {
        // ignore
    }
  };

  const handleSceneSelect = (scene: SceneVariation) => {
    triggerHaptic();
    setSelectedSceneId(scene.id);
  };

  const handleQuickSave = async (e: React.MouseEvent, scene: SceneVariation) => {
    e.stopPropagation();
    triggerHaptic();
    if (savedSceneIds.includes(scene.id)) return; 
    if (savingSceneIds.includes(scene.id)) return; 
    setSavingSceneIds(prev => [...prev, scene.id]);
    try {
        const draftConfig: CardConfig = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            imageSrc: scene.url,
            originalImageSrc: originalImageSrc,
            linkType: config.linkType || LinkType.URL,
            targetUrl: config.targetUrl || "",
            linkData: config.linkData,
            title: config.title || "",
            headlineColor: config.headlineColor || "#ffffff",
            headlinePlacement: config.headlinePlacement,
            headlineYOffset: 0,
            cta: config.cta || "",
            ctaColor: config.ctaColor,
            price: config.price || "",
            priceColor: config.priceColor,
            badgeText: config.badgeText,
            badgeColor: config.badgeColor,
            badgePosition: config.badgePosition,
            showQr: config.showQr ?? true,
            showActionCard: config.showActionCard ?? true,
            showFloatingLogo: config.showFloatingLogo,
            logoPosition: config.logoPosition,
            detailBubbles: config.detailBubbles,
            primaryColor: config.primaryColor || "#000000",
            secondaryColor: config.secondaryColor || "#ffffff",
            backgroundColor: config.backgroundColor || "#ffffff",
            backgroundGradient: config.backgroundGradient || ["#000000", "#000000"],
            fontFamily: config.fontFamily || 'Inter',
            placement: config.placement || QRCodePlacement.CARD_BOTTOM,
            logoSrc: config.logoSrc,
            overlayYOffset: 0
        };
        await saveHistoryItem(draftConfig);
        setHistory(prev => [draftConfig, ...prev]);
        setSavedSceneIds(prev => [...prev, scene.id]);
        showNotification("Saved to History", 'success');
    } catch (e) {
        showNotification("Failed to save", 'error');
    } finally {
        setSavingSceneIds(prev => prev.filter(id => id !== scene.id));
    }
  };

  const handleQuickDownload = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    triggerHaptic();
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `ai-scene-${Date.now()}.png`, { type: "image/png" });
      try {
        if (Share && (await Share.canShare()).value) {
             const canShare = await Share.canShare();
             if(canShare.value) {
                 triggerDownload(file); 
                 showNotification("Saved", 'success');
                 return;
             }
        }
        triggerDownload(file);
        showNotification("Saved", 'success');
      } catch(err) {
        triggerDownload(file);
        showNotification("Saved", 'success');
      }
    } catch (e) {
      showNotification("Download failed", 'error');
    }
  };

  const confirmSceneSelection = () => {
    triggerHaptic();
    const selected = generatedScenes.find(s => s.id === selectedSceneId);
    if (selected) {
      setImageSrc(selected.url);
    }
    setState(AppState.EDITOR);
  };

  const toggleVoiceInput = () => {
      triggerHaptic();
      if (isListening) {
          if (recognitionRef.current) {
              recognitionRef.current.stop();
          }
          setIsListening(false);
          return;
      }
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                // @ts-ignore
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.continuous = true; 
                recognition.lang = 'en-US';
                recognition.interimResults = true;
                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setRemixPrompt(prev => (prev + " " + finalTranscript).trim());
                    }
                };
                recognitionRef.current = recognition;
                recognition.start();
            } else {
                showNotification("Voice input not supported on this device", "error");
            }
        })
        .catch((err) => {
            console.error("Mic permission denied", err);
            showNotification("Microphone access denied", "error");
        });
  };

  const handleRemixGenerate = async () => {
      if (!remixPrompt.trim()) return;
      triggerHaptic();
      setRemixOpen(false);
      setState(AppState.GENERATING);
      try {
          const res = await fetch(originalImageSrc);
          const blob = await res.blob();
          const file = new File([blob], "remix_source.jpg", { type: blob.type });
          const newScenes = await generateLifestyleScenes(
              file,
              detectedCategory || ProductCategory.OTHER,
              "User Request",
              [{ label: "Custom Remix", prompt: remixPrompt }]
          );
          if (newScenes.length > 0) {
              setGeneratedScenes(prev => [...prev, ...newScenes]);
              setSelectedSceneId(newScenes[0].id);
              showNotification("Remix Created!", "success");
          } else {
              showNotification("AI couldn't generate that scene.", "error");
          }
          setState(AppState.SCENE_SELECTION);
          setRemixPrompt("");
      } catch (e) {
          showNotification("Remix failed. Try again.", "error");
          setState(AppState.SCENE_SELECTION);
      }
  };

  const prepareFinalImage = async (): Promise<{ dataUrl: string, file: File, config: CardConfig }> => {
      const qrCanvas = qrRef.current?.querySelector('canvas');
      const finalConfig: CardConfig = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageSrc: imageSrc,
        originalImageSrc: originalImageSrc,
        linkType: config.linkType || LinkType.URL,
        targetUrl: computedUrl,
        linkData: config.linkData,
        title: config.title || "",
        headlineColor: config.headlineColor || "#ffffff",
        headlinePlacement: config.headlinePlacement,
        headlineYOffset: config.headlineYOffset || 0,
        cta: config.cta || "",
        ctaColor: config.ctaColor,
        price: config.price || "",
        priceColor: config.priceColor,
        badgeText: config.badgeText,
        badgeColor: config.badgeColor,
        badgePosition: config.badgePosition,
        showQr: config.showQr ?? true,
        showActionCard: config.showActionCard ?? true,
        showFloatingLogo: config.showFloatingLogo,
        logoPosition: config.logoPosition,
        detailBubbles: config.detailBubbles,
        primaryColor: config.primaryColor || "#000000",
        secondaryColor: config.secondaryColor || "#ffffff",
        backgroundColor: config.backgroundColor || "#ffffff",
        backgroundGradient: config.backgroundGradient || ["#000000", "#000000"],
        fontFamily: config.fontFamily || 'Inter',
        placement: config.placement || QRCodePlacement.CARD_BOTTOM,
        qrLogoSrc: config.qrLogoSrc,
        logoSrc: config.logoSrc,
        overlayYOffset: config.overlayYOffset || 0
      };
      const dataUrl = await generateCardImage(finalConfig, qrCanvas || document.createElement('canvas'));
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const safeTitle = (config.title || 'poster').replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 30);
      const fileName = `shop-poster-ai-${safeTitle}-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      return { dataUrl, file, config: finalConfig };
  };

  const handleShare = async () => {
      triggerHaptic();
      if (isSharing || isDownloading) return;
      setIsSharing(true);
      try {
          const { dataUrl, file, config: finalConfig } = await prepareFinalImage();
          await saveHistoryItem(finalConfig);
          setHistory(prev => [finalConfig, ...prev]);

          if (Capacitor.isNativePlatform()) {
              const safeTitle = (config.title || 'poster').replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 30);
              const fileName = `shop-poster-ai-${safeTitle}-${Date.now()}.png`;
              
              try {
                  const savedFile = await Filesystem.writeFile({
                      path: fileName,
                      data: dataUrl.split(',')[1], // Remove header for base64 write
                      directory: Directory.Cache
                  });

                  await Share.share({
                      title: 'Shop Poster AI',
                      files: [savedFile.uri]
                  });
                  showNotification("Shared successfully!", 'success');
              } catch (err) {
                  console.error("Native share error:", err);
                  try {
                      // Fix: Remove invalid File share attempt, just trigger download
                      triggerDownload(file);
                      showNotification("Saved to Photos", 'success'); 
                  } catch(e) {
                      triggerDownload(file);
                      showNotification("Saved to Photos", 'success');
                  }
              }
          } else {
              try {
                  if (navigator.share) {
                      await navigator.share({
                          files: [file],
                          title: 'Shop Poster AI'
                      });
                      showNotification("Shared successfully!", 'success');
                  } else {
                      throw new Error("Web Share API not supported");
                  }
              } catch (err) {
                  triggerDownload(file);
                  showNotification("Saved to Photos", 'success');
              }
          }
      } catch (e) {
          console.error("Share generation failed", e);
          showNotification("Export failed", 'error');
      } finally {
          setIsSharing(false);
      }
  };

  const handleDownload = async () => {
    triggerHaptic();
    if (isSharing || isDownloading) return;
    setIsDownloading(true);
    try {
      const { dataUrl, file, config: finalConfig } = await prepareFinalImage();
      await saveHistoryItem(finalConfig);
      setHistory(prev => [finalConfig, ...prev]);
      
      if (Capacitor.isNativePlatform()) {
          const safeTitle = (config.title || 'poster').replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 30);
          const fileName = `shop-poster-ai-${safeTitle}-${Date.now()}.png`;
          
          try {
              const savedFile = await Filesystem.writeFile({
                  path: fileName,
                  data: dataUrl.split(',')[1],
                  directory: Directory.Cache
              });
              
              await Share.share({ 
                  files: [savedFile.uri],
                  title: "Save Image" 
              });
              showNotification("Saved", 'success');
          } catch (e) {
              console.error("Native save error:", e);
              try {
                  triggerDownload(file);
                  showNotification("Saved to Photos", 'success');
              } catch(err) {
                  triggerDownload(file);
                  showNotification("Saved to Photos", 'success');
              }
          }
      } else {
          triggerDownload(file);
          showNotification("Saved", 'success');
      }
    } catch (e) {
      showNotification("Export failed", 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const loadHistoryItem = (item: CardConfig) => {
    triggerHaptic();
    setGeneratedScenes([]); 
    setImageSrc(item.imageSrc);
    setOriginalImageSrc(item.originalImageSrc || item.imageSrc);
    
    const restoredScenes: SceneVariation[] = [
        { id: 'original', url: item.originalImageSrc || item.imageSrc, label: 'Original Photo', isOriginal: true },
        { id: item.id, url: item.imageSrc, label: 'Saved Design', isOriginal: false }
    ];
    setGeneratedScenes(restoredScenes);
    setSelectedSceneId(item.id);

    setConfig(item);
    setState(AppState.EDITOR);
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    triggerHaptic();
    e.stopPropagation();
    try {
      await deleteHistoryItemDB(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      showNotification("Deleted", 'success');
    } catch (e) { }
  };

  const handleQrClick = () => {
      triggerHaptic();
      if (computedUrl) {
          window.open(computedUrl, '_blank');
          showNotification("Opening Link...", 'success');
      } else {
          showNotification("No link configured", 'error');
      }
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      dragStartY.current = clientY;
      initialOffset.current = config.overlayYOffset || 0;
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (dragStartY.current === null) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = dragStartY.current - clientY; 
      const newOffset = initialOffset.current + deltaY;
      if (newOffset > -100 && newOffset < 800) {
          setConfig(p => ({...p, overlayYOffset: newOffset}));
      }
  };

  const handleDragEnd = () => { dragStartY.current = null; };

  const handleHeadlineDragStart = (e: React.TouchEvent | React.MouseEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      headlineDragStartY.current = clientY;
      headlineInitialOffset.current = config.headlineYOffset || 0;
  };

  const handleHeadlineDragMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (headlineDragStartY.current === null) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = clientY - headlineDragStartY.current; 
      const newOffset = headlineInitialOffset.current + deltaY;
      setConfig(p => ({...p, headlineYOffset: newOffset}));
  };

  const handleHeadlineDragEnd = () => { headlineDragStartY.current = null; };

  const handleLogoDragStart = (e: React.TouchEvent | React.MouseEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      logoDragStart.current = { x: clientX, y: clientY };
      initialLogoPos.current = config.logoPosition || { x: 1080/2 - 70, y: 1350/2 - 70 };
  };

  const handleLogoDragMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!logoDragStart.current || !initialLogoPos.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - logoDragStart.current.x;
      const deltaY = clientY - logoDragStart.current.y;
      const scale = 3.0; 
      setConfig(p => ({
          ...p,
          logoPosition: {
              x: (initialLogoPos.current?.x || 0) + (deltaX * scale),
              y: (initialLogoPos.current?.y || 0) + (deltaY * scale)
          }
      }));
  };

  const handleLogoDragEnd = () => { logoDragStart.current = null; initialLogoPos.current = null; };

  const handleDetailDragStart = (e: React.TouchEvent | React.MouseEvent, id: string) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const bubble = config.detailBubbles?.find(b => b.id === id);
      if (!bubble) return;
      
      activeBubbleId.current = id;
      detailDragStart.current = { x: clientX, y: clientY };
      initialDetailPos.current = { x: bubble.x, y: bubble.y };
  };

  const handleDetailDragMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!activeBubbleId.current || !detailDragStart.current || !initialDetailPos.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - detailDragStart.current.x;
      const deltaY = clientY - detailDragStart.current.y;
      const scale = 3.0; 
      
      const newX = (initialDetailPos.current?.x || 0) + (deltaX * scale);
      const newY = (initialDetailPos.current?.y || 0) + (deltaY * scale);

      setConfig(p => ({
          ...p,
          detailBubbles: p.detailBubbles?.map(b => b.id === activeBubbleId.current ? { ...b, x: newX, y: newY } : b)
      }));
  };

  const handleDetailDragEnd = () => { 
      activeBubbleId.current = null; 
      detailDragStart.current = null; 
      initialDetailPos.current = null; 
  };

  const handleBubbleDoubleTap = (id: string) => {
      const now = Date.now();
      if (lastTap.current && lastTap.current.id === id && (now - lastTap.current.time) < 300) {
          triggerHaptic();
          setConfig(c => ({
              ...c,
              detailBubbles: c.detailBubbles?.filter(b => b.id !== id) || []
          }));
          showNotification("Bubble Removed", "success");
          lastTap.current = null;
      } else {
          lastTap.current = { id, time: now };
      }
  };

  const handleMagicWandClick = () => {
      triggerHaptic();
      if (!userProfile.isPremium) { setPremiumModalOpen({type: 'Remix'}); } else { setRemixOpen(true); }
  };

  const handleHistoryClick = () => {
      triggerHaptic();
      if (!userProfile.isPremium) { setPremiumModalOpen({type: 'History'}); } else { setState(AppState.HISTORY); }
  };

  const handlePremiumUnlock = () => {
      triggerHaptic();
      setUserProfile(p => { const upd = {...p, isPremium: true}; saveUserProfile(upd); return upd; });
      setPremiumModalOpen(null);
      showNotification("💎 Premium Unlocked (Tester)", "success");
      if (premiumModalOpen?.type === 'History') setState(AppState.HISTORY);
      if (premiumModalOpen?.type === 'Remix') setRemixOpen(true);
  };

  const handleBrandColorUpdate = (index: number, color: string) => {
      const newColors = [...(userProfile.brandColors || ['#FFE600', '#FFFFFF', '#000000'])];
      newColors[index] = color;
      setUserProfile(p => ({...p, brandColors: newColors}));
  };

  const handleReferralShare = async () => {
    triggerHaptic();

    if (!userProfile.id) {
      showNotification('Unable to share referral: missing user profile.', 'error');
      return;
    }

    const eligibleAt = nextReferralEligibleTime(userProfile.lastReferralShare);
    if (eligibleAt && Date.now() < eligibleAt) {
      const nextTime = new Date(eligibleAt);
      showNotification(`Next referral available at ${nextTime.toLocaleString()}`, 'error');
      return;
    }

    const profile = ensureReferralMetadata(userProfile);
    if (profile !== userProfile) {
      setUserProfile(profile);
      saveUserProfile(profile);
    }

    const { url: referralLink, message } = buildReferralSharePayload(profile.referralCode!);

    const referralResult = await trackReferral(
      profile.id,
      profile.referralCode!,
      profile.waNumber || undefined,
      profile.lastReferralShare,
      profile.referredRecipients ?? [],
    );

    if (!referralResult.success) {
      if (referralResult.nextEligibleTime) {
        const nextTime = new Date(referralResult.nextEligibleTime);
        showNotification(`Next referral available at ${nextTime.toLocaleString()}`, 'error');
      } else {
        showNotification(referralResult.error || 'Referral tracking failed', 'error');
      }
      return;
    }

    const openShareSheet = async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Shop Poster AI', text: message, url: referralLink });
          return true;
        } catch (error) {
          if ((error as Error)?.name === 'AbortError') {
            return false;
          }
          console.error('Web Share API error:', error);
        }
      }

      const text = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      return true;
    };

    const shared = await openShareSheet();
    if (!shared) {
      showNotification('Share cancelled', 'error');
      return;
    }

    const newCredits = profile.credits + 3;
    const updatedProfile: UserProfile = {
      ...profile,
      credits: newCredits,
      lastReferralShare: Date.now(),
      referredRecipients: referralResult.recipientHash
        ? [...(profile.referredRecipients ?? []), referralResult.recipientHash]
        : (profile.referredRecipients ?? []),
    };

    setUserProfile(updatedProfile);
    saveUserProfile(updatedProfile);
    setReferralOpen(false);
    showNotification('🎉 +3 Credits Added!', 'success');

    try {
      await supabase
        .from('users')
        .upsert(
          {
            id: updatedProfile.id,
            credits: updatedProfile.credits,
            referral_code: updatedProfile.referralCode,
            last_referral_share: new Date(updatedProfile.lastReferralShare ?? Date.now()).toISOString(),
          },
          { onConflict: 'id' }
        );
    } catch (error) {
      console.error('Failed to sync referral credits:', error);
    }
  };

  const renderSettingsModal = () => {
    if (!settingsOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="absolute inset-0 pointer-events-none"><CircuitBackground /></div>
        <div className="w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative z-10">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
            <h2 onClick={handleSecretKnock} className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none cursor-pointer"><Settings className="w-5 h-5 text-gold-500" /> Settings</h2>
            <button onClick={() => setSettingsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-neutral-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {settingsTab === 'profile' ? (
                <>
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gold-500 uppercase tracking-widest border-b border-white/5 pb-1">Shop Identity</h3>
                    <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Shop Name</label><input type="text" value={userProfile.shopName} onChange={e => setUserProfile(p => ({...p, shopName: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="My Cool Shop" /></div>
                    <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Brand Logo</label><div className="flex items-center gap-4"><div onClick={() => document.getElementById('logo-upload')?.click()} className="w-16 h-16 rounded-full bg-dark-800 border border-dashed border-dark-600 flex items-center justify-center cursor-pointer hover:border-gold-500 transition-colors overflow-hidden relative">{userProfile.logoSrc ? <img src={userProfile.logoSrc} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-neutral-600" />}<div className="absolute bottom-0 right-0 bg-gold-500 p-1 rounded-full"><CameraIcon className="w-3 h-3 text-black" /></div></div><div className="flex-1"><p className="text-xs text-neutral-400 mb-2">Upload your shop logo to appear on the action button.</p><input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} /><button onClick={() => document.getElementById('logo-upload')?.click()} className="text-[10px] font-bold text-gold-500 uppercase tracking-wider hover:text-white transition-colors">Choose Image</button></div></div></div>
                    <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Brand Colors</label><div className="flex gap-3">{userProfile.brandColors.map((c, i) => (<div key={i} className="h-10 w-full rounded-lg border border-white/10 relative overflow-hidden"><input type="color" value={c} onChange={e => handleBrandColorUpdate(i, e.target.value)} className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0" /><div className="absolute inset-0 pointer-events-none" style={{backgroundColor: c}}></div></div>))}</div><p className="text-[10px] text-neutral-600 mt-2">Tap to edit your 3 signature colors.</p></div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gold-500 uppercase tracking-widest border-b border-white/5 pb-1">Messaging & Payments</h3>
                    <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">WhatsApp Number</label><input type="tel" value={userProfile.waNumber} onChange={e => setUserProfile(p => ({...p, waNumber: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="+1234567890" /></div>
                    <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">PayPal Username</label><input type="text" value={userProfile.paypalUser} onChange={e => setUserProfile(p => ({...p, paypalUser: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="username" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Telegram</label><input type="text" value={userProfile.telegramUser} onChange={e => setUserProfile(p => ({...p, telegramUser: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="@username" /></div>
                        <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Messenger</label><input type="text" value={userProfile.messengerUser} onChange={e => setUserProfile(p => ({...p, messengerUser: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="page.name" /></div>
                    </div>
                    <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Default Website / Booking</label><input type="url" value={userProfile.defaultUrl} onChange={e => setUserProfile(p => ({...p, defaultUrl: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="https://myshop.com" /></div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gold-500 uppercase tracking-widest border-b border-white/5 pb-1">Social Handles</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Instagram</label><input type="text" value={userProfile.instagramUser} onChange={e => setUserProfile(p => ({...p, instagramUser: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="@username" /></div>
                        <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">TikTok</label><input type="text" value={userProfile.tiktokUser} onChange={e => setUserProfile(p => ({...p, tiktokUser: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="@username" /></div>
                        <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">YouTube</label><input type="text" value={userProfile.youtubeUser} onChange={e => setUserProfile(p => ({...p, youtubeUser: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="@channel" /></div>
                        <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Twitter (X)</label><input type="text" value={userProfile.twitterUser} onChange={e => setUserProfile(p => ({...p, twitterUser: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-xl p-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="@handle" /></div>
                    </div>
                </div>
                <div className="pt-4">
                    <button onClick={handleSaveProfile} className="w-full bg-white text-black font-bold py-4 rounded-xl uppercase tracking-wide active:scale-95 transition-transform shadow-lg">Save Profile</button>
                </div>
                </>
            ) : (
                <div className="space-y-4 animate-in fade-in">
                    <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4"><p className="text-xs text-gold-500 leading-relaxed"><strong>Dev Mode:</strong> Override the embedded API key with your own.</p></div>
                    <div><label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Gemini API Key</label><div className="relative"><Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" /><input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} className="w-full bg-black border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-gold-500 outline-none" placeholder="AIza..." /></div></div>
                    <div className="flex gap-3">
                        <button onClick={handleSaveApiKey} className="flex-1 bg-gold-500 text-black font-bold py-3 rounded-xl uppercase tracking-wide active:scale-95 transition-transform">Save Key</button>
                        <button onClick={handleClearApiKey} className="px-4 border border-red-500/50 text-red-500 rounded-xl active:scale-95 transition-transform"><Trash2 className="w-5 h-5" /></button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPremiumModal = () => {
      if (!premiumModalOpen) return null;
      let content = { title: "THE UNFAIR ADVANTAGE", text: "Why do 1% of shops get 99% of sales? They move faster.", points: ["⚡ Instant Auto-Fill", "🎙️ Voice Director Mode", "🏦 Asset Library Vault"] };
      if (premiumModalOpen.type === 'History') { content = { title: "POWER MODE ACTIVATED", text: "Stop throwing away money. Save your winning designs and change prices in seconds.", points: ["🚀 RE-LAUNCH VIRAL HITS", "💸 INSTANT PRICE CHANGES", "🏦 LIFETIME ASSET VAULT"] }; }
      else if (premiumModalOpen.type === 'Remix') { content = { title: "POWER MODE ACTIVATED", text: "Don't hope for a good result. Command it. Force the AI to execute your exact vision.", points: ["🎙️ Voice Commands", "🧠 Advanced AI Logic", "🎨 Infinite Variations"] }; }
      else if (premiumModalOpen.type === 'Brand Logo') { content = { title: "OWN THE FEED", text: "Amateurs promote the tool. Pros promote themselves. Replace our logo with yours.", points: ["💎 Custom Brand Logo", "🚫 Remove Watermarks", "✨ Professional Look"] }; }
      else if (premiumModalOpen.type === 'Bubbles') { content = { title: "DETAILS SELL", text: "Showcase textures, angles, and features with picture-in-picture zooms.", points: ["🔍 Zoom Bubbles", "✨ Multiple Angles", "📸 Pro Layouts"] }; }

      return (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="absolute inset-0 pointer-events-none"><CircuitBackground /></div>
              <div className="w-full max-w-md bg-dark-900 rounded-3xl border border-gold-500/20 overflow-hidden shadow-2xl animate-bounce-in flex flex-col max-h-[90vh] relative z-10">
                  <div className="p-6 pb-2 text-center relative">
                      <button onClick={() => setPremiumModalOpen(null)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 z-10"><X className="w-4 h-4 text-neutral-400" /></button>
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gold-500/10 rounded-full mb-3 border border-gold-500/20 text-gold-500"><Crown className="w-6 h-6" /></div>
                      <h2 className="text-2xl font-black text-white uppercase leading-none mb-2">{content.title}</h2>
                      <p className="text-xs text-neutral-400 leading-snug max-w-[250px] mx-auto mb-4">{content.text}</p>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {content.points.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                <Check className="w-3 h-3 text-gold-500" />
                                <span className="text-[10px] font-bold text-white uppercase">{p}</span>
                            </div>
                        ))}
                      </div>
                  </div>
                  <div className="px-6 py-4 bg-white/5 border-y border-white/5">
                      <div className="flex justify-between items-center relative px-4">
                          <div className="absolute left-4 right-4 top-3 h-0.5 bg-gradient-to-r from-gold-500/50 to-gold-500 z-0 rounded-full"></div>
                          <div className="z-10 flex flex-col items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gold-500 border-4 border-dark-900 flex items-center justify-center shadow-gold-glow"><Zap className="w-3 h-3 text-black" /></div>
                              <div className="text-center"><p className="text-[10px] font-bold text-white">Today</p><p className="text-[9px] text-neutral-500">Instant Access</p></div>
                          </div>
                          <div className="z-10 flex flex-col items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-dark-800 border-4 border-dark-900 flex items-center justify-center ring-2 ring-gold-500/20"><Bell className="w-3 h-3 text-gold-500" /></div>
                              <div className="text-center"><p className="text-[10px] font-bold text-neutral-300">Day 7</p><p className="text-[9px] text-neutral-500">Reminder Email</p></div>
                          </div>
                          <div className="z-10 flex flex-col items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-dark-800 border-4 border-dark-900 flex items-center justify-center"><Star className="w-3 h-3 text-neutral-400" /></div>
                              <div className="text-center"><p className="text-[10px] font-bold text-neutral-300">Day 8</p><p className="text-[9px] text-neutral-500">First Charge</p></div>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 pt-4 space-y-3 bg-dark-900">
                      <div onClick={() => setSelectedPlan('yearly')} className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedPlan === 'yearly' ? 'border-gold-500 bg-gold-500/5 shadow-[0_0_15px_rgba(255,230,0,0.1)]' : 'border-dark-700 hover:bg-white/5'}`}>
                          {selectedPlan === 'yearly' && <div className="absolute -top-2.5 left-4 bg-gold-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Best Value</div>}
                          <div>
                              <p className="text-sm font-bold text-white">Yearly Access</p>
                              <p className="text-[10px] text-neutral-400"><span className="text-white font-bold">$99.99</span> / year</p>
                          </div>
                          <div className="text-right">
                              <p className="text-sm font-bold text-gold-500">$8.33/mo</p>
                              <p className="text-[9px] text-green-400">Save 50%</p>
                          </div>
                      </div>
                      <div onClick={() => setSelectedPlan('monthly')} className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedPlan === 'monthly' ? 'border-white/50 bg-white/5' : 'border-white/5 hover:border-white/20 hover:bg-white/5'}`}>
                          <div>
                              <p className="text-sm font-bold text-white">Monthly</p>
                              <p className="text-[10px] text-neutral-400">Pay as you go</p>
                          </div>
                          <div className="text-right">
                              <p className="text-sm font-bold text-white">$14.99</p>
                              <p className="text-[9px] text-neutral-500">/ month</p>
                          </div>
                      </div>
                      <button onClick={handlePremiumUnlock} className="w-full bg-gradient-to-r from-gold-400 to-gold-500 text-black font-black py-4 rounded-xl uppercase tracking-wider shadow-gold-glow active:scale-95 transition-transform text-sm mt-2">
                          {selectedPlan === 'yearly' ? 'Start 7-Day Free Trial' : 'Subscribe Now'}
                      </button>
                      <div className="flex items-center justify-center gap-2 opacity-50">
                          <Lock className="w-3 h-3 text-neutral-500" />
                          <p className="text-[9px] text-neutral-500 text-center">No charge today. Cancel anytime in settings.</p>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderReferralModal = () => {
      if (!referralOpen) return null;
      return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-in fade-in">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-none"></div>
              <div className="w-full max-w-sm bg-dark-900 rounded-3xl border border-gold-500/20 overflow-hidden shadow-2xl animate-bounce-in text-center p-8 relative z-10">
                  <button onClick={() => setReferralOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 z-10"><X className="w-4 h-4 text-neutral-400" /></button>
                  <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/30 animate-pulse-slow"><Gift className="w-10 h-10 text-gold-500" /></div>
                  <h2 className="text-2xl font-black text-white uppercase mb-2">NEVER PAY FOR AI</h2>
                  <p className="text-neutral-400 text-sm mb-8 leading-relaxed">Invite your business friends to use Shop Poster AI. Get <span className="text-gold-500 font-bold">+3 Free Credits</span> instantly for every share.</p>
                  <button onClick={handleReferralShare} className="w-full bg-gold-500 text-black font-black py-4 rounded-xl uppercase tracking-wide shadow-gold-glow flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <MessageCircle className="w-5 h-5 fill-green-600 text-green-600" /> <span className="text-black">Share on WhatsApp</span>
                  </button>
                  <p className="text-[10px] text-neutral-600 mt-4">No limits. Share more, earn more.</p>
              </div>
          </div>
      );
  };

  const renderOnboarding = () => (
    <div className="h-full flex flex-col bg-dark-950 p-6 relative overflow-hidden">
        <CircuitBackground />
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full z-10">
            <div className="mb-8 flex justify-center"><BrainCameraLogo size="w-24 h-24" /></div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase text-center">Welcome to <br/><span className="text-gold-500">Shop Poster AI</span></h1>
            <p className="text-neutral-400 mb-8 leading-relaxed text-center">Let's set up your brand identity so every poster is ready to post instantly.</p>
            
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Your Shop Name</label>
                    <input 
                        type="text" 
                        value={userProfile.shopName}
                        onChange={(e) => setUserProfile({...userProfile, shopName: e.target.value})}
                        className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-colors"
                        placeholder="e.g. Urban Kicks"
                    />
                </div>
                
                <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Brand Colors</label>
                    <div className="flex gap-4">
                        {userProfile.brandColors.map((color, idx) => (
                            <div key={idx} className="flex-1 h-12 rounded-xl border border-white/10 relative overflow-hidden group">
                                <input 
                                    type="color" 
                                    value={color}
                                    onChange={(e) => handleBrandColorUpdate(idx, e.target.value)}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0"
                                />
                                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: color }} />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 pointer-events-none transition-opacity">
                                    <Palette className="w-4 h-4 text-white drop-shadow-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-auto pt-6 z-10 max-w-sm mx-auto w-full">
            <button 
                onClick={completeOnboarding}
                disabled={!userProfile.shopName}
                className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-lg"
            >
                Start Creating <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    </div>
  );

  const renderPermissions = () => (
      <div className="h-full flex flex-col items-center justify-center bg-dark-950 p-8 text-center relative overflow-hidden">
          <CircuitBackground />
          <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-dark-900 rounded-3xl flex items-center justify-center mb-8 border border-white/5 animate-bounce-in shadow-gold-glow-lg">
                  <CameraIcon className="w-10 h-10 text-gold-500 animate-pulse-slow" />
              </div>
              <h2 className="text-2xl font-black text-white mb-4 uppercase">Camera Access</h2>
              <p className="text-neutral-400 mb-8 max-w-xs mx-auto leading-relaxed">Daily posting fear? One tap and it disappears. Unlock your camera to start selling.</p>
              <button 
                  onClick={requestPermissionsAndContinue}
                  className="w-full max-w-xs bg-gold-500 text-black font-black py-4 rounded-xl uppercase tracking-wide active:scale-95 transition-transform shadow-gold-glow"
              >
                  Allow Access
              </button>
          </div>
      </div>
  );

  const renderUpload = () => (
    <div className="flex flex-col h-[100dvh] bg-dark-950 text-white relative overflow-hidden animate-in fade-in">
      <CircuitBackground />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <header className="pt-safe px-6 py-2 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3" onClick={handleSecretKnock}><BrainCameraLogo size="w-10 h-10" /><h1 className="text-xl font-black tracking-tight text-white leading-none">SHOP<br/><span className="text-gold-500">POSTER AI</span></h1></div>
        <div className="flex gap-3">
            <div className="h-10 px-3 rounded-full bg-dark-800 border border-white/10 flex items-center gap-2">
                <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-gold-500 fill-gold-500" /><span className="text-xs font-bold text-white">{userProfile.credits}</span></div>
                <div className="w-[1px] h-4 bg-white/10"></div>
                <button onClick={() => { triggerHaptic(); setReferralOpen(true); }} className="bg-gold-500/10 hover:bg-gold-500/20 rounded-full p-1 transition-colors"><Gift className="w-3 h-3 text-gold-500" /></button>
            </div>
            <button onClick={handleHistoryClick} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 active:scale-95 transition-all border border-white/5 relative"><Clock className="w-5 h-5 text-neutral-300" />{!userProfile.isPremium && <div className="absolute -top-1 -right-1 bg-gold-500 rounded-full p-0.5"><Crown className="w-2 h-2 text-black" /></div>}</button>
            <button onClick={() => { triggerHaptic(); setSettingsOpen(true); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 active:scale-95 transition-all border border-white/5"><Settings className="w-5 h-5 text-neutral-300" /></button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full relative z-10 pb-20">
        <div className="text-center mb-10">
            <div className="inline-block px-4 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6"><span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest">AI Marketing Studio</span></div>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter leading-[0.9] drop-shadow-2xl">SELL<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">FASTER</span></h2>
            <p className="text-neutral-500 text-sm font-medium px-8 leading-relaxed">Transform boring product photos into viral marketing posters in seconds.</p>
        </div>
        <div className="w-full space-y-4">
            <button onClick={takeNativePhoto} className="w-full py-5 rounded-2xl bg-white text-black font-black text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-[0_0_40px_rgba(255,255,255,0.15)]"><CameraIcon className="w-6 h-6" /><span className="uppercase tracking-wide">Take Photo</span></button>
            <div className="flex items-center gap-4 py-2 opacity-50"><div className="h-[1px] bg-white/20 flex-1"></div><span className="text-[10px] font-bold text-white uppercase">OR</span><div className="h-[1px] bg-white/20 flex-1"></div></div>
            {/* Polished Upload Button */}
            <div className={`w-full py-4 border rounded-2xl flex flex-row items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98] ` + (isDragging ? 'border-gold-500 bg-gold-500/10' : 'border-white/10 hover:border-gold-500/30 bg-white/5')} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); triggerHaptic(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => { triggerHaptic(); pickFromGallery(); }}>
                <Upload className="w-5 h-5 text-neutral-400" />
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Upload from Gallery</p>
            </div>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </main>
      <div className="absolute bottom-safe left-0 right-0 py-4 text-center"><p className="text-[10px] text-neutral-700 font-mono uppercase">Version 2.3 • Business Edition</p></div>
    </div>
  );

  // ... (remaining renders same as before: renderRemixModal, renderSceneSelection, renderEditor, renderHistory, renderLoading) ...
  const renderLoading = (title: string, subtitle: string) => (
    <div className="flex flex-col h-[100dvh] bg-black items-center justify-center p-6 relative overflow-hidden">
      <div className="relative w-24 h-24 mb-8"><div className="absolute inset-0 border-4 border-dark-800 rounded-full"></div><div className="absolute inset-0 border-t-4 border-gold-500 rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-gold-500 w-8 h-8 animate-pulse" /></div></div>
      <h2 className="text-xl font-black text-white mb-2 tracking-widest uppercase text-center">{title}</h2>
      <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest text-center animate-pulse">{subtitle}</p>
    </div>
  );

  const renderSceneSelection = () => (
    <div className="flex flex-col h-[100dvh] bg-black text-white animate-slide-up">
      <header className="pt-safe px-4 py-4 bg-black/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/10 flex justify-between items-center">
         <button onClick={() => { triggerHaptic(); setState(AppState.UPLOAD); }} className="p-2 rounded-full active:bg-white/10"><ChevronLeft className="w-6 h-6" /></button>
         <h1 className="text-sm font-bold uppercase tracking-wider">Choose Style</h1>
         <button onClick={handleHistoryClick} className="p-2 rounded-full active:bg-white/10 text-neutral-400 hover:text-white relative"><Clock className="w-6 h-6" />{!userProfile.isPremium && <div className="absolute top-0 right-0 bg-gold-500 rounded-full p-0.5"><Crown className="w-2 h-2 text-black" /></div>}</button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
        <div className="flex justify-center mb-4"><span className="text-[10px] text-neutral-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Tap <Save className="w-3 h-3 inline mb-0.5"/> to save for later</span></div>
        <div className="grid grid-cols-2 gap-3">
          {generatedScenes.map((scene) => {
            const isSaved = savedSceneIds.includes(scene.id);
            const isSaving = savingSceneIds.includes(scene.id);
            return (
              <div key={scene.id} onClick={() => handleSceneSelect(scene)} className={`relative rounded-xl overflow-hidden aspect-square cursor-pointer transition-all border-2 active:scale-95 ${selectedSceneId === scene.id ? 'border-gold-500 ring-2 ring-gold-500/20' : 'border-dark-800'}`}>
                <img src={scene.url} className="w-full h-full object-cover" alt={scene.label} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-3 pt-8"><p className="text-[10px] font-bold uppercase text-center text-white tracking-wider">{scene.label}</p></div>
                {selectedSceneId === scene.id && (<div className="absolute top-2 left-2 bg-gold-500 rounded-full p-1 text-black shadow-sm z-10"><Check className="w-3 h-3" /></div>)}
                <button onClick={(e) => handleQuickSave(e, scene)} disabled={isSaved || isSaving} className={`absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all z-30 shadow-lg ${isSaved ? 'bg-green-500 border-green-500 text-white' : 'bg-black/40 border-white/10 text-white hover:bg-black/60'}`}>{isSaving ? (<Loader2 className="w-4 h-4 animate-spin" />) : isSaved ? (<Check className="w-4 h-4" />) : (<Save className="w-4 h-4" />)}</button>
                <button onClick={(e) => handleQuickDownload(e, scene.url)} className="absolute top-2 right-14 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border border-white/10 bg-black/40 text-white hover:bg-black/60 z-30 shadow-lg active:scale-90 transition-transform"><Download className="w-4 h-4" /></button>
              </div>
            );
          })}
          <div onClick={handleMagicWandClick} className="relative rounded-xl overflow-hidden aspect-square cursor-pointer transition-all border-2 border-white/10 hover:border-gold-500 bg-white/5 flex flex-col items-center justify-center gap-2 active:scale-95"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-orange-500 flex items-center justify-center shadow-lg relative"><Wand2 className="w-6 h-6 text-black" />{!userProfile.isPremium && <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md"><Crown className="w-3 h-3 text-black" /></div>}</div><p className="text-[10px] font-bold uppercase text-white tracking-wider">Custom Remix</p><span className="text-[8px] text-neutral-400 font-mono">Tell AI what to do</span></div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 pb-safe p-4 bg-gradient-to-t from-black via-black to-transparent z-30"><button onClick={confirmSceneSelection} className="w-full bg-gold-500 text-black rounded-xl font-black py-4 shadow-gold-glow uppercase text-sm tracking-wider active:scale-[0.98] transition-transform">Edit Selected</button></div>
    </div>
  );

  const renderEditor = () => {
    const isOverlay = config.placement !== QRCodePlacement.CARD_BOTTOM;
    const fontFamilyClass = config.fontFamily === 'Anton' ? 'font-sport' : config.fontFamily === 'Playfair Display' ? 'font-luxury' : 'font-sans';
    const headlinePlacement = config.headlinePlacement || HeadlinePlacement.BOTTOM_LEFT;
    let headlinePositionClass = "bottom-40 left-4 text-left"; 
    if (headlinePlacement === HeadlinePlacement.TOP_LEFT) headlinePositionClass = "top-20 left-4 text-left";
    if (headlinePlacement === HeadlinePlacement.TOP_CENTER) headlinePositionClass = "top-20 left-0 right-0 text-center";
    if (headlinePlacement === HeadlinePlacement.CENTER) headlinePositionClass = "top-1/2 -translate-y-1/2 left-0 right-0 text-center";
    
    const brandColors = userProfile.brandColors || ['#FFE600', '#FFFFFF', '#000000'];
    const badgePositionStyle = config.badgePosition === 'right' ? { right: '1.5rem', top: '1.5rem' } : { left: '1.5rem', top: '1.5rem' };
    const badgeExists = !!config.badgeText;
    const badgeIsLeft = config.badgePosition !== 'right';
    const shouldPushDown = badgeExists && ((headlinePlacement === HeadlinePlacement.TOP_LEFT && badgeIsLeft) || headlinePlacement === HeadlinePlacement.TOP_CENTER);
    
    const headlineStyle = {
        color: config.headlineColor || '#ffffff',
        transform: `translateY(${config.headlineYOffset || 0}px)`,
        marginTop: shouldPushDown ? '180px' : '0px',
        transition: 'margin-top 0.3s ease-out'
    };

    const previewScale = 360 / 1080;
    const scaledLogoStyle = {
        left: 0,
        top: 0,
        transform: `translate(${(config.logoPosition?.x ?? (1080/2 - 70)) * previewScale}px, ${(config.logoPosition?.y ?? (1350/2 - 70)) * previewScale}px)`,
        width: `${140 * previewScale}px`,
        height: `${140 * previewScale}px`
    };

    return (
      <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden relative animate-slide-up">
        <div className="pt-safe px-4 py-3 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 pointer-events-none">
          <button onClick={() => { triggerHaptic(); setState(AppState.SCENE_SELECTION); }} className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md active:scale-90 transition-transform"><ChevronLeft className="w-6 h-6" /></button>
          <div className="flex gap-2 pointer-events-auto">
             {originalImageSrc && (
                <button onClick={handleMagicWandClick} className="bg-gold-500/20 border border-gold-500/50 text-gold-500 w-10 h-10 rounded-full flex items-center justify-center shadow-gold-glow active:scale-95 transition-transform relative">
                    <Wand2 className="w-4 h-4" />
                    {!userProfile.isPremium && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm"><Crown className="w-2 h-2 text-black" /></div>}
                </button>
            )}
            <button onClick={handleDownload} disabled={isSharing || isDownloading} className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">{isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}</button>
            <button onClick={handleShare} disabled={isSharing || isDownloading} className="bg-gold-500 text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">{isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}</button>
          </div>
        </div>
        
        <div className="flex-1 relative flex items-center justify-center bg-[#121212] overflow-hidden pb-[40vh]">
          <div className="relative shadow-2xl transition-all duration-300 ease-out w-[85%] max-w-[360px] aspect-[1080/1350]">
             <div className="absolute inset-0 rounded-sm overflow-hidden bg-white ring-1 ring-white/10">
                 <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${config.backgroundGradient?.[0] || '#1a1a1a'}, ${config.backgroundGradient?.[1] || '#000000'})` }}></div>
                 
                 {/* DETAIL BUBBLES (GLOBAL LAYER) */}
                 {config.detailBubbles?.map((bubble) => {
                    const style = {
                        left: 0,
                        top: 0,
                        transform: `translate(${(bubble.x * previewScale)}px, ${(bubble.y * previewScale)}px)`,
                        width: `${210 * previewScale}px`,
                        height: `${210 * previewScale}px`
                    };
                    return (
                        <div key={bubble.id} className="absolute z-50 cursor-move touch-none" style={style} onTouchStart={(e) => handleDetailDragStart(e, bubble.id)} onTouchMove={handleDetailDragMove} onTouchEnd={handleDetailDragEnd} onMouseDown={(e) => handleDetailDragStart(e, bubble.id)} onMouseMove={handleDetailDragMove} onMouseUp={handleDetailDragEnd} onMouseLeave={handleDetailDragEnd} onClick={() => handleBubbleDoubleTap(bubble.id)}>
                            <div className="w-full h-full rounded-full flex items-center justify-center shadow-lg active:scale-105 transition-transform border-2 border-white/30 overflow-hidden bg-white/10 backdrop-blur-sm">
                                <img src={bubble.src} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    );
                 })}

                 {isOverlay ? (
                   // --- POSTER MODE ---
                   <div className="absolute inset-0 select-none">
                     <img src={imageSrc} className="w-full h-full object-cover" alt="Background" />
                     <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 to-transparent"></div>
                     {config.badgeText && (<div className="absolute px-3 py-1 transform -skew-x-12 shadow-lg z-10 transition-all duration-300" style={{ backgroundColor: config.badgeColor || config.primaryColor, ...badgePositionStyle }}><span className="text-black font-black text-xs uppercase transform skew-x-12 block">{config.badgeText}</span></div>)}
                     <div className={`absolute ${headlinePositionClass} px-4 z-20 cursor-ns-resize touch-none`} style={headlineStyle} onTouchStart={handleHeadlineDragStart} onTouchMove={handleHeadlineDragMove} onTouchEnd={handleHeadlineDragEnd} onMouseDown={handleHeadlineDragStart} onMouseMove={handleHeadlineDragMove} onMouseUp={handleHeadlineDragEnd} onMouseLeave={handleHeadlineDragEnd}><h2 className={`text-3xl font-bold leading-tight drop-shadow-lg italic ${fontFamilyClass}`}>{config.title?.toUpperCase()}</h2></div>
                     {config.showFloatingLogo && (
                        <div className="absolute z-30 cursor-move touch-none" style={scaledLogoStyle} onTouchStart={handleLogoDragStart} onTouchMove={handleLogoDragMove} onTouchEnd={handleLogoDragEnd} onMouseDown={handleLogoDragStart} onMouseMove={handleLogoDragMove} onMouseUp={handleLogoDragEnd} onMouseLeave={handleLogoDragEnd}><div className="w-full h-full rounded-full flex items-center justify-center shadow-lg active:scale-105 transition-transform border-2 border-white/20" style={{backgroundColor: config.primaryColor}}>{config.logoSrc ? (<img src={config.logoSrc} className="w-full h-full object-cover rounded-full" />) : (<CameraIcon className="w-1/2 h-1/2 text-black" />)}</div></div>
                     )}
                     {(config.showActionCard ?? true) && (
                         <div className="absolute left-4 right-4 cursor-move touch-none active:scale-[1.01] transition-transform z-20" style={{ bottom: `${24 + (config.overlayYOffset || 0)}px` }} onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd} onMouseDown={handleDragStart} onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
                            <div className="flex justify-center mb-2 opacity-50"><div className="w-10 h-1 bg-white/30 rounded-full shadow-sm backdrop-blur-sm"></div></div>
                            <div className="h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center p-3 gap-3 shadow-xl">
                                {config.showQr && (<button onClick={handleQrClick} className="bg-white p-1.5 rounded-lg w-16 h-16 shrink-0 flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-sm relative group"><QRCodeCanvas value={computedUrl} size={50} /><div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg"><ExternalLink className="w-6 h-6 text-black" /></div></button>)}
                                <div className="flex-1 min-w-0"><p className="text-[10px] font-bold uppercase" style={{ color: config.ctaColor || '#9ca3af' }}>{config.cta || "SCAN TO BUY"}</p>{config.price && <p className={`text-lg font-bold leading-none ${fontFamilyClass}`} style={{ color: config.priceColor || '#ffffff' }}>{config.price}</p>}</div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: config.primaryColor }}>{config.logoSrc ? (<img src={config.logoSrc} className="w-full h-full object-cover" alt="Brand" />) : (<Check className="w-5 h-5 text-black" />)}</div>
                            </div>
                         </div>
                     )}
                   </div>
                 ) : (
                   // --- CARD MODE (Side-by-Side Magazine Layout) ---
                   <div className="flex flex-col h-full relative z-10">
                     {/* Top Image Area (65%) */}
                     <div className="h-[65%] w-full overflow-hidden relative bg-gray-100">
                        <img src={imageSrc} className="w-full h-full object-cover" alt="Product" />
                        {config.badgeText && (<div className="absolute px-3 py-1 transform -skew-x-12 shadow-lg" style={{ bottom: '2rem', backgroundColor: config.badgeColor || config.primaryColor, ...badgePositionStyle }}><span className="text-black font-black text-xs uppercase transform skew-x-12 block">{config.badgeText}</span></div>)}
                        {/* Floating Logo Support in Card Mode */}
                        {config.showFloatingLogo && (
                            <div className="absolute z-30 cursor-move touch-none" style={scaledLogoStyle} onTouchStart={handleLogoDragStart} onTouchMove={handleLogoDragMove} onTouchEnd={handleLogoDragEnd} onMouseDown={handleLogoDragStart} onMouseMove={handleLogoDragMove} onMouseUp={handleLogoDragEnd} onMouseLeave={handleLogoDragEnd}><div className="w-full h-full rounded-full flex items-center justify-center shadow-lg active:scale-105 transition-transform border-2 border-white/20" style={{backgroundColor: config.primaryColor}}>{config.logoSrc ? (<img src={config.logoSrc} className="w-full h-full object-cover rounded-full" />) : (<CameraIcon className="w-1/2 h-1/2 text-black" />)}</div></div>
                        )}
                     </div>
                     
                     {/* Curved Splitter */}
                     <div className="absolute top-[63%] left-0 right-0 h-8 rounded-t-[100%] scale-x-125 z-20" style={{ background: config.backgroundGradient?.[0] || '#1a1a1a' }}></div>
                     
                     {/* Bottom Info Panel (Flex Row Split) */}
                     <div className="flex-1 flex flex-row items-center px-6 gap-4">
                        {/* Left Side: Text */}
                        {(config.showActionCard ?? true) && (
                            <div className="flex-1 flex flex-col items-start text-left min-w-0 justify-center h-full">
                                <h2 className={`text-2xl font-bold mb-1 leading-tight ${fontFamilyClass}`} style={{color: config.headlineColor || '#ffffff'}}>{config.title}</h2>
                                {config.price && <p className={`text-xl font-bold mb-1 ${fontFamilyClass}`} style={{ color: config.priceColor || config.primaryColor }}>{config.price}</p>}
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.ctaColor || '#d1d5db' }}>{config.cta}</p>
                            </div>
                        )}
                        
                        {/* Right Side: QR Code */}
                        {config.showQr && (
                            <div className="shrink-0 bg-white p-2 rounded-xl shadow-lg relative group">
                                <QRCodeCanvas value={computedUrl} size={80} imageSettings={config.qrLogoSrc ? { src: config.qrLogoSrc, height: 16, width: 16, excavate: true } : undefined} />
                            </div>
                        )}
                     </div>
                   </div>
                 )}
             </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-dark-900 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-40 flex flex-col border-t border-white/5 h-[40vh] pb-safe">
          <div className="w-full flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-neutral-700/50 rounded-full"></div></div>
          <div className="px-4 pb-2">
            <div className="flex bg-black/30 p-1 rounded-xl border border-white/5 backdrop-blur-md">
              {[{ id: 'content', icon: Type, label: 'Content' }, { id: 'qr', icon: LinkIcon, label: 'Link' }, { id: 'design', icon: Palette, label: 'Design' }].map(tab => (
                 <button key={tab.id} onClick={() => { triggerHaptic(); setActiveTab(tab.id as any); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${activeTab === tab.id ? 'bg-gold-500 text-black shadow-sm' : 'text-neutral-500 hover:text-white'}`}><tab.icon className="w-3.5 h-3.5" /> {tab.label}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar overscroll-contain">
            {activeTab === 'design' && (
              <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase mb-3 block tracking-wider">Typography</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ id: 'Anton', label: 'Sport' }, { id: 'Playfair Display', label: 'Luxury' }, { id: 'Inter', label: 'Clean' }].map(font => (
                            <button key={font.id} onClick={() => { triggerHaptic(); setConfig(p => ({...p, fontFamily: font.id as FontFamily})); }} className={`py-3 rounded-lg border text-[10px] font-bold uppercase transition-all active:scale-95 ${config.fontFamily === font.id ? 'border-gold-500 bg-gold-500/10 text-gold-500' : 'border-dark-700 bg-black text-neutral-500'}`}>{font.label}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase mb-3 block tracking-wider">Colors</label>
                    <div className="flex flex-col gap-3">
                        {/* REFACTORED: Left Input, Right Swatches */}
                        <div className="flex gap-3 h-12 w-full">
                            <div className="flex-1 bg-black rounded-xl border border-dark-700 relative flex items-center overflow-hidden active:scale-95 transition-transform">
                                <input 
                                    type="color" 
                                    value={config.primaryColor} 
                                    onInput={(e) => setConfig(p => ({...p, primaryColor: (e.target as HTMLInputElement).value}))} 
                                    onChange={(e) => setConfig(p => ({...p, primaryColor: e.target.value}))} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                />
                                <div className="ml-2 w-8 h-8 rounded-lg border border-white/10 transition-colors shrink-0" style={{ backgroundColor: config.primaryColor }}></div>
                                <span className="ml-3 text-xs font-mono text-neutral-400 pointer-events-none">Accent</span>
                            </div>
                            
                            <div className="flex gap-2 items-center shrink-0 relative z-50">
                                {brandColors.map((c, i) => (
                                    <button 
                                        key={i} 
                                        onClick={(e) => { e.stopPropagation(); triggerHaptic(); setConfig(p => ({...p, primaryColor: c})); }} 
                                        className="w-12 h-12 rounded-xl border border-white/10 active:scale-90 transition-transform shadow-sm" 
                                        style={{backgroundColor: c}} 
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 h-12 w-full">
                            <div className="flex-1 bg-black rounded-xl border border-dark-700 relative flex items-center overflow-hidden active:scale-95 transition-transform">
                                <input 
                                    type="color" 
                                    value={config.backgroundGradient?.[0]} 
                                    onInput={(e) => setConfig(p => ({...p, backgroundGradient: [(e.target as HTMLInputElement).value, p.backgroundGradient?.[1] || '#000000']}))} 
                                    onChange={(e) => setConfig(p => ({...p, backgroundGradient: [e.target.value, p.backgroundGradient?.[1] || '#000000']}))} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                />
                                <div className="ml-2 w-8 h-8 rounded-lg border border-white/10 transition-colors shrink-0" style={{ background: `linear-gradient(135deg, ${config.backgroundGradient?.[0]}, ${config.backgroundGradient?.[1]})` }}></div>
                                <span className="ml-3 text-xs font-mono text-neutral-400 pointer-events-none">Backdrop</span>
                            </div>
                            
                            <div className="flex gap-2 items-center shrink-0 relative z-50">
                                {brandColors.map((c, i) => (
                                    <button 
                                        key={i} 
                                        onClick={(e) => { e.stopPropagation(); triggerHaptic(); setConfig(p => ({...p, backgroundGradient: [c, p.backgroundGradient?.[1] || '#000000']})); }} 
                                        className="w-12 h-12 rounded-xl border border-white/10 active:scale-90 transition-transform shadow-sm" 
                                        style={{backgroundColor: c}} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        <button onClick={() => { triggerHaptic(); setConfig(prev => ({ ...prev, placement: QRCodePlacement.BOTTOM_RIGHT })); }} className={`flex-shrink-0 px-4 py-3 rounded-xl border active:scale-95 transition-all flex flex-col items-center gap-2 w-24 ${isOverlay ? 'border-gold-500 bg-gold-500/10' : 'border-dark-700 bg-black'}`}><ImageIcon className={`w-5 h-5 ${isOverlay ? 'text-gold-500' : 'text-neutral-500'}`} /><span className={`text-[10px] font-bold uppercase ${isOverlay ? 'text-white' : 'text-neutral-500'}`}>Poster</span></button>
                        <button onClick={() => { triggerHaptic(); setConfig(prev => ({ ...prev, placement: QRCodePlacement.CARD_BOTTOM })); }} className={`flex-shrink-0 px-4 py-3 rounded-xl border active:scale-95 transition-all flex flex-col items-center gap-2 w-24 ${!isOverlay ? 'border-gold-500 bg-gold-500/10' : 'border-dark-700 bg-black'}`}><Layout className={`w-5 h-5 ${!isOverlay ? 'text-gold-500' : 'text-neutral-500'}`} /><span className={`text-[10px] font-bold uppercase ${!isOverlay ? 'text-white' : 'text-neutral-500'}`}>Card</span></button>
                        <button onClick={() => { 
                            triggerHaptic(); 
                            if(!userProfile.isPremium) { 
                                setPremiumModalOpen({type: 'Bubbles'}); 
                            } else {
                                if ((config.detailBubbles?.length || 0) < 3) detailInputRef.current?.click(); 
                                else showNotification("Max 3 bubbles", "error"); 
                            }
                        }} className={`flex-shrink-0 px-4 py-3 rounded-xl border active:scale-95 transition-all flex flex-col items-center gap-2 w-32 ${ (config.detailBubbles?.length || 0) > 0 ? 'border-gold-500 bg-gold-500/10' : 'border-dark-700 bg-black'}`}><ZoomIn className={`w-5 h-5 ${(config.detailBubbles?.length || 0) > 0 ? 'text-gold-500' : 'text-neutral-500'}`} /><span className={`text-[10px] font-bold uppercase ${(config.detailBubbles?.length || 0) > 0 ? 'text-white' : 'text-neutral-500'}`}>Add Detail ({config.detailBubbles?.length || 0}/3)</span></button>
                    </div>
                    
                    {(generatedScenes.length > 0 && originalImageSrc) && (
                        <div className="mt-2 space-y-2 animate-in fade-in">
                            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Quick Add from Session</p>
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                {generatedScenes.map((scene) => (
                                    <button key={scene.id} onClick={() => addDetailBubble(scene.url)} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 active:scale-90 transition-transform shrink-0">
                                        <img src={scene.url} className="w-full h-full object-cover" alt="asset" />
                                        <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors"></div>
                                        <div className="absolute bottom-1 right-1 bg-black/50 rounded-full p-0.5"><Plus className="w-3 h-3 text-white" /></div>
                                        {!userProfile.isPremium && <div className="absolute top-1 right-1 bg-gold-500 rounded-full p-0.5 shadow-sm"><Crown className="w-2 h-2 text-black" /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {config.detailBubbles && config.detailBubbles.length > 0 && (
                        <p className="text-[10px] text-neutral-500 pl-1">Double-tap a bubble to remove it.</p>
                    )}
                 </div>
                 <input ref={detailInputRef} type="file" className="hidden" accept="image/*" onChange={handleDetailUpload} />
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-5">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-gold-500 uppercase tracking-wider">Headline</label>
                        <div className="flex items-center gap-2">
                             <div className="flex gap-1 mr-2">
                                {brandColors.map((c, i) => (
                                    <button key={i} onClick={() => setConfig(p => ({...p, headlineColor: c}))} className="w-3 h-3 rounded-full border border-white/20" style={{backgroundColor: c}} />
                                ))}
                             </div>
                            <span className="text-[10px] text-neutral-500 uppercase font-bold">Color</span>
                            <div className="h-6 w-6 rounded-full border border-white/20 relative overflow-hidden">
                                <input type="color" value={config.headlineColor || '#ffffff'} onInput={(e) => setConfig(p => ({...p, headlineColor: (e.target as HTMLInputElement).value}))} onChange={(e) => setConfig(p => ({...p, headlineColor: e.target.value}))} className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0" />
                                <div className="absolute inset-0 pointer-events-none" style={{backgroundColor: config.headlineColor || '#ffffff'}}></div>
                            </div>
                        </div>
                    </div>
                    <EmojiInput value={config.title || ""} onChange={(val) => setConfig(p => ({...p, title: val}))} />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Badge</label>
                        <div className="flex items-center gap-3">
                             <button onClick={() => setConfig(p => ({...p, badgePosition: p.badgePosition === 'right' ? 'left' : 'right'}))} className="flex items-center gap-1 bg-dark-800 border border-dark-700 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400"><ArrowLeftRight className="w-3 h-3" />{config.badgePosition === 'right' ? 'RIGHT' : 'LEFT'}</button>
                             <div className="flex gap-1 mr-2">{brandColors.map((c, i) => (<button key={i} onClick={() => setConfig(p => ({...p, badgeColor: c}))} className="w-3 h-3 rounded-full border border-white/20" style={{backgroundColor: c}} />))}</div>
                            <span className="text-[10px] text-neutral-500 uppercase font-bold">Color</span>
                            <div className="h-6 w-6 rounded-full border border-white/20 relative overflow-hidden"><input type="color" value={config.badgeColor || config.primaryColor} onInput={(e) => setConfig(p => ({...p, badgeColor: (e.target as HTMLInputElement).value}))} onChange={(e) => setConfig(p => ({...p, badgeColor: e.target.value}))} className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0" /><div className="absolute inset-0 pointer-events-none" style={{backgroundColor: config.badgeColor || config.primaryColor}}></div></div>
                        </div>
                    </div>
                    <EmojiInput value={config.badgeText || ""} onChange={(val) => setConfig(p => ({...p, badgeText: val}))} placeholder="NEW ARRIVAL" />
                 </div>
                 <div className="flex gap-4">
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-2"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Price</label><div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full border border-white/20 relative overflow-hidden"><input type="color" value={config.priceColor || (isOverlay ? '#ffffff' : config.primaryColor)} onInput={(e) => setConfig(p => ({...p, priceColor: (e.target as HTMLInputElement).value}))} onChange={(e) => setConfig(p => ({...p, priceColor: e.target.value}))} className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0" /><div className="absolute inset-0 pointer-events-none" style={{backgroundColor: config.priceColor || (isOverlay ? '#ffffff' : config.primaryColor)}}></div></div></div></div>
                        <EmojiInput value={config.price || ""} onChange={(val) => setConfig(p => ({...p, price: val}))} placeholder="$0.00" fontClass="font-mono" />
                     </div>
                     <div className="flex-[2]">
                        <div className="flex justify-between items-center mb-2"><label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Action Button</label><div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full border border-white/20 relative overflow-hidden"><input type="color" value={config.ctaColor || (isOverlay ? '#9ca3af' : '#d1d5db')} onInput={(e) => setConfig(p => ({...p, ctaColor: (e.target as HTMLInputElement).value}))} onChange={(e) => setConfig(p => ({...p, ctaColor: e.target.value}))} className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0" /><div className="absolute inset-0 pointer-events-none" style={{backgroundColor: config.ctaColor || (isOverlay ? '#9ca3af' : '#d1d5db')}}></div></div></div></div>
                        <EmojiInput value={config.cta || ""} onChange={(val) => setConfig(p => ({...p, cta: val}))} />
                     </div>
                 </div>
              </div>
            )}
            {activeTab === 'qr' && (
                <div className="space-y-5">
                 <div className="flex bg-black p-1.5 rounded-xl border border-dark-700 gap-1">
                    {[{ id: LinkType.EMAIL, icon: Mail, label: 'Mail' }, { id: LinkType.PAYPAL, icon: DollarSign, label: 'Pay' }, { id: LinkType.URL, icon: LinkIcon, label: 'Link' }, { id: LinkType.WHATSAPP, icon: MessageCircle, label: 'Chat' }].map(type => {
                        const isActive = config.linkType === type.id || (type.id === LinkType.WHATSAPP && (config.linkType === LinkType.TELEGRAM || config.linkType === LinkType.MESSENGER));
                        return (
                        <button key={type.id} onClick={() => { triggerHaptic(); setConfig(p => { if (type.id === LinkType.URL) { return { ...p, linkType: type.id, targetUrl: userProfile.defaultUrl || '' }; } return {...p, linkType: type.id}; }); }} className={`flex-1 flex flex-col items-center py-3 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 border ${isActive ? 'bg-gold-500 text-black border-gold-500 shadow-gold-glow' : 'bg-transparent text-neutral-500 border-transparent hover:bg-white/5'}`}><type.icon className="w-4 h-4 mb-1" />{type.label}</button>
                    )})}
                 </div>
                 <div className="bg-dark-800/30 p-4 rounded-xl border border-white/5 space-y-3">
                    {config.linkType === LinkType.URL && (
                        <div className="space-y-2">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                <button onClick={() => { triggerHaptic(); const base = 'https://instagram.com/'; const val = userProfile.instagramUser ? `${base}${userProfile.instagramUser.replace(/^@/, '')}` : base; setConfig(p => ({...p, targetUrl: val, linkType: LinkType.URL})); }} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-md active:scale-95 transition-transform shrink-0"><Instagram className="w-3 h-3 text-[#E1306C]" /><span className="text-[10px] text-neutral-300">Instagram</span></button>
                                <button onClick={() => { triggerHaptic(); const base = 'https://tiktok.com/@'; const val = userProfile.tiktokUser ? `${base}${userProfile.tiktokUser.replace(/^@/, '')}` : base; setConfig(p => ({...p, targetUrl: val, linkType: LinkType.URL})); }} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-md active:scale-95 transition-transform shrink-0"><span className="text-[10px] font-bold">♪</span><span className="text-[10px] text-neutral-300">TikTok</span></button>
                                <button onClick={() => { triggerHaptic(); const base = 'https://youtube.com/@'; const val = userProfile.youtubeUser ? `${base}${userProfile.youtubeUser.replace(/^@/, '')}` : base; setConfig(p => ({...p, targetUrl: val, linkType: LinkType.URL})); }} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-md active:scale-95 transition-transform shrink-0"><Youtube className="w-3 h-3 text-[#FF0000]" /><span className="text-[10px] text-neutral-300">YouTube</span></button>
                                <button onClick={() => { triggerHaptic(); const base = 'https://x.com/'; const val = userProfile.twitterUser ? `${base}${userProfile.twitterUser.replace(/^@/, '')}` : base; setConfig(p => ({...p, targetUrl: val, linkType: LinkType.URL})); }} className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1.5 rounded-md active:scale-95 transition-transform shrink-0"><span className="text-[10px] font-bold">𝕏</span><span className="text-[10px] text-neutral-300">Twitter</span></button>
                            </div>
                            <input type="url" inputMode="url" placeholder="https://shop.com/item" value={config.targetUrl} onChange={(e) => setConfig(p => ({...p, targetUrl: e.target.value}))} className="w-full bg-black border border-dark-700 rounded-lg text-sm px-4 py-3 text-white placeholder-neutral-600 focus:border-gold-500 outline-none font-mono caret-gold-500 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }} />
                        </div>
                    )}
                    {config.linkType === LinkType.PAYPAL && <div className="flex gap-2"><input type="text" inputMode="text" placeholder="paypal.me/user" value={config.linkData?.paypalUser} onChange={(e) => setConfig(p => ({...p, linkData: {...p.linkData, paypalUser: e.target.value}}))} className="flex-1 bg-black border border-dark-700 rounded-lg px-4 py-3 text-sm text-white outline-none caret-gold-500 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }} /><input type="number" inputMode="decimal" placeholder="$$" value={config.linkData?.paypalAmount} onChange={(e) => setConfig(p => ({...p, linkData: {...p.linkData, paypalAmount: e.target.value}}))} className="w-24 bg-black border border-dark-700 rounded-lg px-4 py-3 text-sm text-white outline-none caret-gold-500 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }} /></div>}
                    {(config.linkType === LinkType.WHATSAPP || config.linkType === LinkType.TELEGRAM || config.linkType === LinkType.MESSENGER) && (
                        <div className="space-y-4">
                            <div className="flex justify-center gap-5 py-2">
                                <button onClick={() => { triggerHaptic(); setConfig(p => ({...p, linkType: LinkType.WHATSAPP, linkData: {...p.linkData, waNumber: p.linkData?.waNumber || userProfile.waNumber}})); }} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${config.linkType === LinkType.WHATSAPP ? 'bg-green-500 ring-4 ring-green-500/30 scale-110 z-10' : 'bg-dark-700 hover:bg-dark-600 opacity-60'}`}><MessageCircle className={`w-7 h-7 ${config.linkType === LinkType.WHATSAPP ? 'text-black' : 'text-neutral-400'}`} fill={config.linkType === LinkType.WHATSAPP ? "currentColor" : "none"} /></button>
                                <button onClick={() => { triggerHaptic(); setConfig(p => ({...p, linkType: LinkType.TELEGRAM, linkData: {...p.linkData, telegramUser: p.linkData?.telegramUser || userProfile.telegramUser}})); }} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${config.linkType === LinkType.TELEGRAM ? 'bg-[#229ED9] ring-4 ring-[#229ED9]/30 scale-110 z-10' : 'bg-dark-700 hover:bg-dark-600 opacity-60'}`}><Send className={`w-6 h-6 ml-[-2px] mt-[2px] ${config.linkType === LinkType.TELEGRAM ? 'text-white' : 'text-neutral-400'}`} fill={config.linkType === LinkType.TELEGRAM ? "currentColor" : "none"} /></button>
                                <button onClick={() => { triggerHaptic(); setConfig(p => ({...p, linkType: LinkType.MESSENGER, linkData: {...p.linkData, messengerUser: p.linkData?.messengerUser || userProfile.messengerUser}})); }} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg ${config.linkType === LinkType.MESSENGER ? 'bg-gradient-to-b from-[#00C6FF] to-[#0072FF] ring-4 ring-blue-500/30 scale-110 z-10' : 'bg-dark-700 hover:bg-dark-600 opacity-60'}`}><Zap className={`w-7 h-7 ${config.linkType === LinkType.MESSENGER ? 'text-white' : 'text-neutral-400'}`} fill={config.linkType === LinkType.MESSENGER ? "currentColor" : "none"} /></button>
                            </div>
                            {config.linkType === LinkType.WHATSAPP && (<div className="space-y-2 animate-bounce-in"><input type="tel" inputMode="tel" placeholder="WhatsApp Number" value={config.linkData?.waNumber || ''} onChange={(e) => setConfig(p => ({...p, linkData: {...p.linkData, waNumber: e.target.value}}))} className="w-full bg-black border border-dark-700 rounded-lg px-4 py-3 text-sm text-white outline-none font-mono caret-green-500 focus:border-green-500 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }} /><input type="text" inputMode="text" placeholder="Message (optional)" value={config.linkData?.waMessage || ''} onChange={(e) => setConfig(p => ({...p, linkData: {...p.linkData, waMessage: e.target.value}}))} className="w-full bg-black border border-dark-700 rounded-lg px-4 py-3 text-sm text-white outline-none font-mono caret-green-500 focus:border-green-500 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }} /></div>)}
                            {config.linkType === LinkType.TELEGRAM && (<div className="relative animate-bounce-in"><div className="absolute left-4 top-3.5 text-neutral-500">@</div><input type="text" inputMode="text" placeholder="username" value={config.linkData?.telegramUser || ''} onChange={(e) => setConfig(p => ({...p, linkData: {...p.linkData, telegramUser: e.target.value}}))} className="w-full bg-black border border-dark-700 rounded-lg pl-8 pr-4 py-3 text-sm text-white outline-none font-mono caret-blue-400 focus:border-blue-400 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }} /></div>)}
                            {config.linkType === LinkType.MESSENGER && (<div className="relative animate-bounce-in"><div className="absolute left-4 top-3.5 text-neutral-500">m.me/</div><input type="text" inputMode="text" placeholder="page.username" value={config.linkData?.messengerUser || ''} onChange={(e) => setConfig(p => ({...p, linkData: {...p.linkData, messengerUser: e.target.value}}))} className="w-full bg-black border border-dark-700 rounded-lg pl-16 pr-4 py-3 text-sm text-white outline-none font-mono caret-blue-600 focus:border-blue-600 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }} /></div>)}
                        </div>
                    )}
                    {config.linkType === LinkType.EMAIL && (<input type="email" inputMode="email" placeholder="Email Address" value={config.linkData?.emailAddr || ''} onChange={(e) => setConfig(p => ({...p, linkData: {...p.linkData, emailAddr: e.target.value}}))} className="w-full bg-black border border-dark-700 rounded-lg px-4 py-3 text-sm text-white outline-none font-mono caret-gold-500 select-text" style={{ userSelect: 'text', WebkitUserSelect: 'text' }} />)}
                    <div className="flex justify-between items-center pt-1"><span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Result</span><span className="text-[10px] text-gold-500 font-mono max-w-[150px] truncate opacity-80">{computedUrl || 'Empty'}</span></div>
                 </div>
                 <div className="flex items-center justify-between bg-black p-4 rounded-xl border border-dark-700"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-white" /><span className="text-sm font-bold text-white">Show Action Card</span></div><button onClick={() => { triggerHaptic(); setConfig(p => ({...p, showActionCard: !(p.showActionCard ?? true)})); }} className={`w-12 h-7 rounded-full transition-colors relative ${config.showActionCard !== false ? 'bg-gold-500' : 'bg-dark-700'}`}><div className={`absolute top-1 bottom-1 w-5 h-5 rounded-full bg-white transition-transform ${config.showActionCard !== false ? 'left-6' : 'left-1'}`} /></button></div>
                 <div className="flex items-center justify-between bg-black p-4 rounded-xl border border-dark-700"><div className="flex items-center gap-2"><Star className="w-4 h-4 text-white" /><span className="text-sm font-bold text-white">Show Floating Brand Logo</span></div><button onClick={() => { triggerHaptic(); setConfig(p => ({...p, showFloatingLogo: !p.showFloatingLogo})); }} className={`w-12 h-7 rounded-full transition-colors relative ${config.showFloatingLogo ? 'bg-gold-500' : 'bg-dark-700'}`}><div className={`absolute top-1 bottom-1 w-5 h-5 rounded-full bg-white transition-transform ${config.showFloatingLogo ? 'left-6' : 'left-1'}`} /></button></div>
                 <div className="flex items-center justify-between bg-black p-4 rounded-xl border border-dark-700"><span className="text-sm font-bold text-white">Show QR Code</span><button onClick={() => { triggerHaptic(); setConfig(p => ({...p, showQr: !(p.showQr ?? true)})); }} className={`w-12 h-7 rounded-full transition-colors relative ${config.showQr !== false ? 'bg-gold-500' : 'bg-dark-700'}`}><div className={`absolute top-1 bottom-1 w-5 h-5 rounded-full bg-white transition-transform ${config.showQr !== false ? 'left-6' : 'left-1'}`} /></button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRemixModal = () => {
      if (!remixOpen) return null;
      return (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
             <div className="w-full max-w-md bg-dark-900 rounded-3xl border border-gold-500/20 shadow-2xl overflow-hidden animate-slide-up relative z-10">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                      <div className="flex items-center gap-2"><div className="p-1.5 bg-gold-500 rounded-lg"><Wand2 className="w-4 h-4 text-black" /></div><span className="font-black text-white uppercase tracking-wider text-sm">AI Director Mode</span></div>
                      <button onClick={() => { setRemixOpen(false); setRemixPrompt(""); }} className="p-2 rounded-full hover:bg-white/10 text-neutral-400"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-neutral-400 text-xs leading-relaxed">Describe exactly what you want. The AI will rebuild the scene pixel-by-pixel.</p>
                      <div className="relative">
                          <textarea 
                             value={remixPrompt} 
                             onChange={(e) => setRemixPrompt(e.target.value)} 
                             placeholder="e.g. On a rustic wooden table with morning sunlight coming through a window..." 
                             className="w-full h-32 bg-black border border-dark-700 rounded-xl p-4 text-white text-sm focus:border-gold-500 outline-none resize-none leading-relaxed" 
                          />
                          <button onClick={toggleVoiceInput} className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-dark-800 text-neutral-400 hover:text-white border border-white/10'}`}>
                              {isListening ? <AudioLines className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </button>
                      </div>
                      <button onClick={handleRemixGenerate} disabled={!remixPrompt.trim()} className="w-full bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl uppercase tracking-wider shadow-gold-glow active:scale-95 transition-transform flex items-center justify-center gap-2">
                          <Wand2 className="w-4 h-4" /> Generate Remix
                      </button>
                  </div>
             </div>
          </div>
      );
  };

  const renderHistory = () => (
    <div className="flex flex-col h-[100dvh] bg-black text-white animate-slide-up">
      <header className="pt-safe px-4 py-4 bg-black/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/10 flex items-center gap-4">
         <button onClick={() => { triggerHaptic(); setState(AppState.UPLOAD); }} className="p-2 rounded-full active:bg-white/10"><ChevronLeft className="w-6 h-6" /></button>
         <h1 className="text-sm font-bold uppercase tracking-wider">Your Designs</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] opacity-50">
                <Clock className="w-12 h-12 mb-4 text-neutral-600" />
                <p className="text-sm font-bold text-neutral-500 uppercase">No history yet</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {history.map(item => (
                    <div key={item.id} onClick={() => loadHistoryItem(item)} className="relative group aspect-[1080/1350] bg-dark-900 rounded-xl overflow-hidden border border-white/10 active:scale-95 transition-transform cursor-pointer">
                        <img src={item.imageSrc} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        <button onClick={(e) => deleteHistoryItem(e, item.id)} className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                            <p className="text-[10px] font-bold text-white truncate">{item.title || 'Untitled'}</p>
                            <p className="text-[9px] text-neutral-400">{new Date(item.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );

  return (
    <>
      <div style={{ display: 'none' }} ref={qrRef}>
         <QRCodeCanvas 
            value={computedUrl} 
            size={400}
            level="H"
            imageSettings={config.qrLogoSrc ? {
                src: config.qrLogoSrc,
                height: 80,
                width: 80,
                excavate: true,
            } : undefined}
         />
      </div>
      {notification && (<div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce-in border ${notification.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>{notification.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}<span className="text-xs font-bold uppercase tracking-wide">{notification.message}</span></div>)}
      {renderSettingsModal()}
      {renderRemixModal()}
      {renderPremiumModal()}
      {renderReferralModal()}
      <div className="w-full h-full bg-black">
        {state === AppState.ONBOARDING && renderOnboarding()}
        {state === AppState.PERMISSIONS && renderPermissions()}
        {state === AppState.UPLOAD && renderUpload()}
        {state === AppState.ANALYZING && renderLoading("Analyzing Product", "Detecting features & generating strategy")}
        {state === AppState.GENERATING && renderLoading("Creating Scenes", "Generating lifestyle photography")}
        {state === AppState.SCENE_SELECTION && renderSceneSelection()}
        {state === AppState.EDITOR && renderEditor()}
        {state === AppState.HISTORY && renderHistory()}
      </div>
    </>
  );
};

export default App;
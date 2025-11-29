
import { CardConfig, UserProfile, LinkType } from "../types";

const createUserId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const buildDefaultProfile = (): UserProfile => ({
  id: createUserId(),
  hasOnboarded: false,
  credits: 5,
  isPremium: false,
  shopName: "",
  brandColors: ['#FFE600', '#FFFFFF', '#000000'],
  defaultLinkType: LinkType.URL,
  defaultUrl: "",
  paypalUser: "",
  waNumber: "",
  waMessage: "Hi, I'd like to order...",
  telegramUser: "",
  messengerUser: "",
  emailAddr: "",
  instagramUser: "",
  tiktokUser: "",
  youtubeUser: "",
  twitterUser: "",
  referralCode: "",
  lastReferralShare: undefined,
  referredRecipients: [],
});

const DB_NAME = 'SmartShopDB';
const STORE_NAME = 'history';
const DB_VERSION = 1;
const PROFILE_KEY = 'shop_poster_user_profile';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// --- User Profile (LocalStorage) ---

export const getUserProfile = (): UserProfile => {
  const baseline = buildDefaultProfile();
  const stored = localStorage.getItem(PROFILE_KEY);
  if (!stored) {
    return baseline;
  }

  try {
    const parsed: Partial<UserProfile> & Record<string, unknown> = JSON.parse(stored);
    const merged: UserProfile = {
      ...baseline,
      ...parsed,
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : baseline.id,
      referralCode: typeof parsed.referralCode === 'string' ? parsed.referralCode : (parsed as Record<string, unknown>).referral_code as string || "",
      referredRecipients: Array.isArray(parsed.referredRecipients) ? parsed.referredRecipients : [],
    };
    return merged;
  } catch (error) {
    console.error("Failed to parse stored user profile. Resetting to defaults.", error);
    return baseline;
  }
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

// --- History (IndexedDB) ---

export const getHistory = async (): Promise<CardConfig[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const res = request.result as CardConfig[];
        // Sort by timestamp desc (newest first)
        res.sort((a, b) => b.timestamp - a.timestamp);
        resolve(res);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to load history from DB", e);
    return [];
  }
};

export const saveHistoryItem = async (item: CardConfig): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // Put the item
      const request = store.put(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to save to DB", e);
    throw e;
  }
};

export const deleteHistoryItemDB = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Failed to delete from DB", e);
    throw e;
  }
};
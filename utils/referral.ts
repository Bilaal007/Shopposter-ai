const REFERRAL_PREFIX = 'ref_';
const REFERRAL_CODE_LENGTH = 10;
const REFERRAL_STORAGE_KEY = 'pending_referral_code';

const simpleHash = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

const safeBtoa = (value: string): string => {
  try {
    return typeof btoa === 'function' ? btoa(value) : Buffer.from(value, 'binary').toString('base64');
  } catch (error) {
    return simpleHash(value);
  }
};

export const generateReferralCode = (userId: string): string => {
  const base = safeBtoa(userId || simpleHash(String(Date.now()))).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const suffix = base || simpleHash(userId).padEnd(REFERRAL_CODE_LENGTH, '0');
  return `${REFERRAL_PREFIX}${suffix.substring(0, REFERRAL_CODE_LENGTH)}`;
};

export const generateDeviceFingerprint = (): string => {
  try {
    const navigatorInfo = [
      typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
      typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      Intl?.DateTimeFormat?.().resolvedOptions().timeZone ?? 'utc'
    ].join('|');

    let canvasFingerprint = 'no-canvas';
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.textBaseline = 'top';
        context.font = '14px "Arial"';
        context.fillStyle = '#f60';
        context.fillRect(125, 1, 62, 20);
        context.fillStyle = '#069';
        context.fillText('ShopPosterAI', 2, 15);
        canvasFingerprint = canvas.toDataURL().substring(22);
      }
    }

    return `dev_${simpleHash(`${navigatorInfo}|${canvasFingerprint}`)}`;
  } catch (error) {
    return `dev_${simpleHash(String(Date.now()))}`;
  }
};

export const hashRecipientIdentifier = (value: string): string => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  return `recipient_${simpleHash(normalized)}`;
};

export const getReferralShareLink = (referralCode: string): string => {
  const baseUrl = 'https://shopposter.ai';
  return `${baseUrl}?ref=${referralCode}`;
};

export const storePendingReferral = (referralCode: string): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(REFERRAL_STORAGE_KEY, referralCode);
};

export const checkPendingReferral = (): string | null => {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(REFERRAL_STORAGE_KEY);
};

export const clearPendingReferral = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
};

export const nextReferralEligibleTime = (lastReferralShare?: number | null): number | null => {
  if (!lastReferralShare) return null;
  const windowMs = 24 * 60 * 60 * 1000;
  return lastReferralShare + windowMs;
};

import { supabase } from './supabase';
import {
  generateReferralCode,
  generateDeviceFingerprint,
  hashRecipientIdentifier,
  getReferralShareLink,
  nextReferralEligibleTime,
  storePendingReferral,
  checkPendingReferral,
  clearPendingReferral,
} from '../utils/referral';

// Track a new referral
export const trackReferral = async (
  referrerId: string,
  referralCode: string,
  recipientIdentifier?: string,
  lastReferralShare?: number | null,
  existingRecipients: string[] = [],
) => {
  try {
    const fingerprint = generateDeviceFingerprint();
    const recipientHash = recipientIdentifier ? hashRecipientIdentifier(recipientIdentifier) : null;
    const windowMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const localEligibleTime = nextReferralEligibleTime(lastReferralShare);

    if (recipientHash && existingRecipients.includes(recipientHash)) {
      return {
        success: false,
        error: 'This recipient has already been credited.',
      } as const;
    }

    const [{ data: lastServerShareRows, error: lastServerShareError }, { data: lastDeviceShareRows, error: lastDeviceShareError }] = await Promise.all([
      supabase
        .from('referrals')
        .select('created_at')
        .eq('referrer_id', referrerId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('referrals')
        .select('created_at')
        .eq('referral_code', referralCode)
        .eq('device_fingerprint', fingerprint)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    if (lastServerShareError) throw lastServerShareError;
    if (lastDeviceShareError) throw lastDeviceShareError;

    const serverLastShare = lastServerShareRows?.[0]?.created_at
      ? new Date(lastServerShareRows[0].created_at).getTime()
      : null;
    const deviceLastShare = lastDeviceShareRows?.[0]?.created_at
      ? new Date(lastDeviceShareRows[0].created_at).getTime()
      : null;

    const eligibilityCandidates = [
      localEligibleTime,
      serverLastShare ? serverLastShare + windowMs : null,
      deviceLastShare ? deviceLastShare + windowMs : null,
    ].filter((value): value is number => typeof value === 'number');

    const nextEligibleTime = eligibilityCandidates.length ? Math.max(...eligibilityCandidates) : null;

    if (nextEligibleTime && now < nextEligibleTime) {
      return {
        success: false,
        error: 'You can only share once every 24 hours.',
        nextEligibleTime,
      } as const;
    }

    if (recipientHash) {
      const { data: existingRecipientRows, error: recipientLookupError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrerId)
        .eq('recipient_hash', recipientHash)
        .limit(1);

      if (recipientLookupError) throw recipientLookupError;

      if (existingRecipientRows && existingRecipientRows.length > 0) {
        return {
          success: false,
          error: 'This recipient has already been credited.',
        } as const;
      }
    }

    const { data, error } = await supabase
      .from('referrals')
      .insert([
        { 
          referrer_id: referrerId,
          referral_code: referralCode,
          recipient_hash: recipientHash,
          device_fingerprint: fingerprint,
          created_at: new Date().toISOString()
        }
      ]);
    
    if (error) throw error;
    return { success: true, data, recipientHash } as const;
  } catch (error) {
    console.error('Error tracking referral:', error);
    return { success: false, error: (error as Error).message } as const;
  }
};

// Verify if a referral code is valid
export const verifyReferral = async (referralCode: string) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .single();
    
    if (error) throw error;
    if (data) {
      storePendingReferral(referralCode);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error verifying referral:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Get user's referral stats
export const getReferralStats = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId);
    
    if (error) throw error;
    
    return {
      totalReferrals: count || 0,
      // Add more stats as needed
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return { totalReferrals: 0 };
  }
};

// Process a referral when a new user signs up
export const processReferral = async (referralCode: string, newUserId: string) => {
  try {
    // Verify the referral code
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('referral_code', referralCode)
      .single();
    
    if (referralError || !referral) {
      throw new Error('Invalid referral code');
    }
    
    // Update referrer's credits
    const { error: updateError } = await supabase.rpc('increment_credits', {
      user_id: referral.referrer_id,
      credit_amount: 3
    });
    
    if (updateError) throw updateError;
    
    clearPendingReferral();
    return { success: true };
  } catch (error: unknown) {
    console.error('Error processing referral:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const buildReferralSharePayload = (referralCode: string) => {
  const url = getReferralShareLink(referralCode);
  const message = `🔥 I found a cheat code for product photos. It uses AI to make professional posters instantly. Download here: ${url}`;
  return { url, message };
};

export {
  generateReferralCode,
  checkPendingReferral,
  clearPendingReferral,
};

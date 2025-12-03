import { PlatformType, MarketingCopy } from '../types';

const API_ENDPOINT = 'https://api.gemini.example.com/generate'; // Replace with actual API endpoint

/**
 * Generates marketing copy using AI based on the product and platform
 */
export async function generateMarketingCopy(
  productName: string,
  platform: PlatformType,
  productDescription?: string
): Promise<MarketingCopy> {
  // In a real implementation, this would call the Gemini API
  // For now, we'll use mock data based on the platform
  
  const mockResponses = {
    [PlatformType.TIKTOK]: {
      caption: `🔥 Just dropped: ${productName}! \n\n${productDescription || 'Perfect for your next adventure! 🚀'}\n\n#${productName.replace(/\s+/g, '')} #NewDrop #MustHave`,
      hashtags: [
        productName.replace(/\s+/g, ''),
        'NewDrop',
        'MustHave',
        'ShopNow',
        'Trending',
        platform === PlatformType.TIKTOK ? 'TikTokMadeMeBuyIt' : 'ShopSmall'
      ],
      tone: 'playful' as const,
      platform,
      characterCount: 0 // Will be calculated
    },
    [PlatformType.REELS]: {
      caption: `Introducing our latest: ${productName}! ${productDescription || 'Elevate your style today.'} ✨\n\n#${productName.replace(/\s+/g, '')} #NewArrival #ShopNow`,
      hashtags: [
        productName.replace(/\s+/g, ''),
        'NewArrival',
        'ShopNow',
        'InstagramFashion',
        'StyleInspo'
      ],
      tone: 'casual' as const,
      platform,
      characterCount: 0 // Will be calculated
    },
    [PlatformType.NONE]: {
      caption: `${productName} - ${productDescription || 'Discover the perfect addition to your collection.'} #${productName.replace(/\s+/g, '')}`,
      hashtags: [
        productName.replace(/\s+/g, ''),
        'NewArrival',
        'ShopNow'
      ],
      tone: 'professional' as const,
      platform,
      characterCount: 0 // Will be calculated
    }
  };

  const response = mockResponses[platform] || mockResponses[PlatformType.NONE];
  
  // Calculate character count
  const characterCount = response.caption.length + response.hashtags.join(' ').length;
  
  return {
    ...response,
    platform,
    characterCount
  };
}

/**
 * Copies text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

/**
 * Shares content using the Web Share API if available
 */
export async function shareContent(
  title: string,
  text: string,
  url?: string,
  file?: File
): Promise<boolean> {
  if (navigator.share) {
    try {
      const shareData: ShareData = { title, text };
      if (url) shareData.url = url;
      if (file && navigator.canShare?.({ files: [file] })) {
        shareData.files = [file];
      }
      
      await navigator.share(shareData);
      return true;
    } catch (err) {
      console.error('Error sharing:', err);
      return false;
    }
  }
  return false;
}

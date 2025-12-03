import { useState, useEffect } from 'react';
import { CardConfig, PlatformType } from '../types';
import { generateMarketingCopy, copyToClipboard, shareContent } from '../services/marketingService';

interface MarketingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cardConfig: CardConfig;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const MarketingDrawer: React.FC<MarketingDrawerProps> = ({
  isOpen,
  onClose,
  cardConfig,
  canvasRef
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [marketingCopy, setMarketingCopy] = useState(cardConfig.marketingCopy);
  const [copied, setCopied] = useState(false);

  // Generate marketing copy when the drawer opens
  useEffect(() => {
    if (isOpen && !marketingCopy) {
      generateCopy();
    }
  }, [isOpen, marketingCopy]);

  const generateCopy = async () => {
    try {
      setIsGenerating(true);
      const copy = await generateMarketingCopy(
        cardConfig.title || 'Product',
        cardConfig.platform || PlatformType.NONE,
        cardConfig.title // Using title as fallback since description doesn't exist
      );
      setMarketingCopy(copy);
      // Update the card config with the generated copy
      cardConfig.marketingCopy = copy;
    } catch (error) {
      console.error('Error generating marketing copy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!marketingCopy) return;
    
    const textToCopy = `${marketingCopy.caption}\n\n${marketingCopy.hashtags.join(' ')}`;
    const success = await copyToClipboard(textToCopy);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    
    try {
      // Convert canvas to blob
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], 'poster.png', { type: 'image/png' });
        const shareText = marketingCopy 
          ? `${marketingCopy.caption}\n\n${marketingCopy.hashtags.join(' ')}`
          : cardConfig.title || 'Check this out!';
        
        await shareContent(cardConfig.title || 'Poster', shareText, undefined, file);
      }, 'image/png');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Share Your Creation</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : marketingCopy ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <div className="bg-gray-50 p-3 rounded-md text-gray-800 whitespace-pre-line">
                  {marketingCopy.caption}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hashtags
                </label>
                <div className="flex flex-wrap gap-2">
                  {marketingCopy.hashtags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                {marketingCopy.characterCount} characters • {marketingCopy.tone} tone
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Unable to generate marketing copy. Please try again.
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={handleCopy}
            disabled={!marketingCopy || isGenerating}
            className={`px-4 py-2 rounded-md ${
              copied 
                ? 'bg-green-100 text-green-800' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Share Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketingDrawer;

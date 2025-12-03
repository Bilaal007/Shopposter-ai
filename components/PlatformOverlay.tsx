import { LayoutMode } from '../types';

type PlatformType = 'tiktok' | 'reels' | 'none';
import { getCanvasDimensions } from '../utils/layoutUtils';

interface PlatformOverlayProps {
  layoutMode: LayoutMode;
  platform: PlatformType;
  width?: number;
  height?: number;
}

export const PlatformOverlay = ({
  layoutMode,
  platform,
  width: propWidth,
  height: propHeight,
}: PlatformOverlayProps) => {
  // Use provided dimensions or calculate based on layout mode
  const { width, height } = propWidth && propHeight 
    ? { width: propWidth, height: propHeight }
    : getCanvasDimensions(layoutMode);

  // Only show overlay in story mode for now
  if (layoutMode !== LayoutMode.STORY) {
    return null;
  }

  // Platform-specific overlay configurations
  const platformConfig = {
    tiktok: {
      rightIcons: [
        { top: 40, size: 40, icon: '❤️' },
        { top: 100, size: 40, icon: '💬' },
        { top: 160, size: 40, icon: '🔁' },
        { top: 220, size: 40, icon: '🔊' },
        { top: 280, size: 40, icon: '⋯' },
      ],
      bottomGradient: true,
      audioBar: false,
      descriptionArea: false,
    },
    reels: {
      rightIcons: [],
      bottomGradient: false,
      audioBar: true,
      descriptionArea: true,
    },
    none: {
      rightIcons: [],
      bottomGradient: false,
      audioBar: false,
      descriptionArea: false,
    },
  };

  const config = platformConfig[platform] || platformConfig.none;
  const isTikTok = platform === 'tiktok';
  const isReels = platform === 'reels';

  return (
    <div 
      className="platform-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* TikTok Overlay */}
      {isTikTok && (
        <>
          {/* Right-side action icons */}
          <div style={{
            position: 'absolute',
            right: '4%',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'center',
          }}>
            {config.rightIcons.map((icon: { top: number; size: number; icon: string }, index: number) => (
              <div 
                key={index}
                style={{
                  width: `${icon.size}px`,
                  height: `${icon.size}px`,
                  fontSize: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {icon.icon}
              </div>
            ))}
            
            {/* Profile circle */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #FF0050, #FF9A00)',
              border: '2px solid white',
              marginTop: '8px',
            }} />
          </div>

          {/* Bottom gradient */}
          {config.bottomGradient && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '25%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
              pointerEvents: 'none',
            }} />
          )}
        </>
      )}

      {/* Reels Overlay */}
      {isReels && (
        <>
          {/* Audio bar */}
          {config.audioBar && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>🔊</span>
              <span>Original Audio</span>
              <span>•</span>
              <span>username</span>
            </div>
          )}

          {/* Description area */}
          {config.descriptionArea && (
            <div style={{
              position: 'absolute',
              bottom: '100px',
              left: '16px',
              right: '16px',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              fontSize: '14px',
              lineHeight: '1.4',
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>@username</div>
              <div>This is a sample product description that would be hidden by the platform UI</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlatformOverlay;

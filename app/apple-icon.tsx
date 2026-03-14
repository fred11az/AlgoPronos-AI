import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Apple touch icon — aussi utilisé par Google comme fallback favicon
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0F1E 0%, #0d1a2e 100%)',
          borderRadius: '36px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            width: '75px',
            height: '75px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
          }}
        />

        {/* AP letters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '2px',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: '76px',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-4px',
            }}
          >
            A
          </span>
          <span
            style={{
              color: '#00D4FF',
              fontSize: '45px',
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: '6px',
            }}
          >
            P
          </span>
        </div>

        {/* Bottom glow bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '75px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
// 192×192 — dépasse le minimum Google (48×48) et convient aux PWA
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '192px',
          height: '192px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0F1E 0%, #0d1a2e 100%)',
          borderRadius: '38px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '80px',
            height: '80px',
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
              fontSize: '80px',
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
              fontSize: '48px',
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
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80px',
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

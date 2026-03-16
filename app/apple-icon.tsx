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
          background: '#0D1425',
          borderRadius: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Circle clip from logo */}
        <div
          style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            border: '2px solid rgba(0, 153, 255, 0.4)',
            borderRadius: '50%',
          }}
        />

        {/* Central blue dot with glow */}
        <div
          style={{
            width: '30px',
            height: '30px',
            background: '#0099FF',
            borderRadius: '50%',
            boxShadow: '0 0 15px rgba(0, 153, 255, 0.8)',
            zIndex: 2,
          }}
        />

        {/* Peripheral smaller dots */}
        <div style={{ position: 'absolute', left: '42px', top: '70px', width: '22px', height: '22px', background: '#0099FF', borderRadius: '50%', opacity: 0.8 }} />
        <div style={{ position: 'absolute', left: '42px', bottom: '70px', width: '22px', height: '22px', background: '#0099FF', borderRadius: '50%', opacity: 0.8 }} />
      </div>
    ),
    { ...size },
  );
}

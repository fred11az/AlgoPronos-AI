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
          background: '#0D1425',
          borderRadius: '42px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Circle clip from logo */}
        <div
          style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            border: '2px solid rgba(0, 153, 255, 0.4)',
            borderRadius: '50%',
          }}
        />

        {/* Central blue dot with glow */}
        <div
          style={{
            width: '32px',
            height: '32px',
            background: '#0099FF',
            borderRadius: '50%',
            boxShadow: '0 0 15px rgba(0, 153, 255, 0.8)',
            zIndex: 2,
          }}
        />

        {/* Peripheral smaller dots */}
        <div style={{ position: 'absolute', left: '45px', top: '75px', width: '24px', height: '24px', background: '#0099FF', borderRadius: '50%', opacity: 0.8 }} />
        <div style={{ position: 'absolute', left: '45px', bottom: '75px', width: '24px', height: '24px', background: '#0099FF', borderRadius: '50%', opacity: 0.8 }} />
      </div>
    ),
    { ...size },
  );
}

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
          background: 'linear-gradient(135deg, #6366f1 0%, #00D4FF 100%)',
          borderRadius: '36px',
          fontFamily: 'sans-serif',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '104px',
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          A
        </span>
      </div>
    ),
    { ...size },
  );
}

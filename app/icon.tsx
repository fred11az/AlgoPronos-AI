import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1 0%, #00D4FF 100%)',
          borderRadius: '8px',
          fontFamily: 'sans-serif',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '18px',
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

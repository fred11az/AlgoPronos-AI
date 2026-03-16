import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AlgoPronos AI — N°1 Intelligence Artificielle Paris Sportifs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0D1425',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background circle */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            border: '1px solid rgba(0, 153, 255, 0.2)',
            borderRadius: '50%',
            top: '40px',
          }}
        />

        {/* The Neural Net Logo Style */}
        <div style={{ display: 'flex', position: 'relative', width: '300px', height: '300px', marginBottom: '20px', alignItems: 'center', justifyContent: 'center' }}>
           {/* Simple representation of the neural icon */}
           <div style={{ position: 'absolute', width: '250px', height: '250px', border: '2px solid #0099FF', borderRadius: '50%', opacity: 0.3 }} />
           <div style={{ display: 'flex', position: 'relative' }}>
             <div style={{ width: '40px', height: '40px', background: '#0099FF', borderRadius: '50%', boxShadow: '0 0 20px #0099FF' }} />
             <div style={{ width: '40px', height: '40px', background: '#0099FF', borderRadius: '50%', position: 'absolute', left: '-80px', top: '40px', boxShadow: '0 0 15px #0099FF' }} />
             <div style={{ width: '40px', height: '40px', background: '#0099FF', borderRadius: '50%', position: 'absolute', left: '-80px', top: '-40px', boxShadow: '0 0 15px #0099FF' }} />
             <div style={{ width: '30px', height: '30px', background: '#0099FF', borderRadius: '50%', position: 'absolute', right: '-80px', top: '20px', opacity: 0.8 }} />
           </div>
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ fontSize: '84px', fontWeight: 'bold', color: 'white', margin: '0', letterSpacing: '2px' }}>
            AlgoPronos <span style={{ color: '#0099FF' }}>AI</span>
          </h1>
          <p style={{ fontSize: '32px', color: '#00D4FF', marginTop: '16px', letterSpacing: '8px', fontWeight: 500, opacity: 0.9 }}>
            DATA &gt; EMOTION
          </p>
        </div>

        {/* Footer info */}
        <div style={{ position: 'absolute', bottom: '40px', display: 'flex', gap: '40px', color: 'rgba(255,255,255,0.5)', fontSize: '20px' }}>
          <span>N°1 IA Paris Sportifs en Afrique</span>
          <span>•</span>
          <span>algopronos.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

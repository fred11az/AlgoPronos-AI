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
          background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '200px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '150px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '100px',
            padding: '8px 20px',
            marginBottom: '28px',
          }}
        >
          <span style={{ color: '#818cf8', fontSize: '16px', fontWeight: 600 }}>
            ⚡ N°1 IA Paris Sportifs Afrique
          </span>
        </div>

        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #6366f1, #00D4FF)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            🤖
          </div>
          <span
            style={{
              fontSize: '52px',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #ffffff, #a5b4fc)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-1px',
            }}
          >
            AlgoPronos AI
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '26px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            margin: '0 0 36px 0',
          }}
        >
          Intelligence Artificielle · Pronostics Football · Compte Optimisé IA
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '32px' }}>
          {[
            { value: '+15 000', label: 'Utilisateurs actifs' },
            { value: '+50', label: 'Championnats analysés' },
            { value: '100%', label: 'Gratuit' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '16px 28px',
              }}
            >
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#6366f1' }}>{stat.value}</span>
              <span style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <p style={{ position: 'absolute', bottom: '28px', color: '#475569', fontSize: '16px' }}>
          algopronos.com
        </p>
      </div>
    ),
    { ...size },
  );
}

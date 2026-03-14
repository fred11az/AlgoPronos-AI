import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Code Promo 1xBet Afrique — AlgoPronos AI | Bonus 200% + Compte Optimisé IA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const CURRENT_YEAR = new Date().getFullYear();

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
                    background: 'linear-gradient(135deg, #071a07 0%, #0a1f0a 50%, #071a07 100%)',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background glow — green for bonus */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-80px',
                        left: '180px',
                        width: '460px',
                        height: '460px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 70%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-80px',
                        right: '120px',
                        width: '380px',
                        height: '380px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 70%)',
                    }}
                />

                {/* Site badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.4)',
                        borderRadius: '100px',
                        padding: '8px 20px',
                        marginBottom: '24px',
                    }}
                >
                    <span style={{ color: '#4ade80', fontSize: '15px', fontWeight: 600 }}>
                        🌍 AlgoPronos AI — N°1 Paris Sportifs Afrique
                    </span>
                </div>

                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <span
                        style={{
                            fontSize: '48px',
                            fontWeight: 800,
                            color: '#ffffff',
                            letterSpacing: '-1px',
                            marginBottom: '8px',
                        }}
                    >
                        Code Promo 1xBet {CURRENT_YEAR} Afrique
                    </span>
                    <span
                        style={{
                            fontSize: '58px',
                            fontWeight: 900,
                            background: 'linear-gradient(90deg, #4ade80, #00D4FF)',
                            backgroundClip: 'text',
                            color: 'transparent',
                            letterSpacing: '2px',
                        }}
                    >
                        {PROMO_CODE}
                    </span>
                </div>

                {/* Subtitle */}
                <p
                    style={{
                        fontSize: '22px',
                        color: '#86efac',
                        textAlign: 'center',
                        maxWidth: '750px',
                        lineHeight: 1.4,
                        margin: '0 0 32px 0',
                    }}
                >
                    Bonus 200% activé · Compte Optimisé IA exclusif · Gratuit
                </p>

                {/* Stats cards */}
                <div style={{ display: 'flex', gap: '24px' }}>
                    {[
                        { value: 'Bonus 200%', label: 'Bienvenue 1xBet' },
                        { value: 'Compte IA', label: 'Exclusif AlgoPronos' },
                        { value: '+12 pays', label: 'Afrique francophone' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                background: 'rgba(34,197,94,0.08)',
                                border: '1px solid rgba(34,197,94,0.25)',
                                borderRadius: '16px',
                                padding: '14px 24px',
                            }}
                        >
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#4ade80' }}>{stat.value}</span>
                            <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* URL */}
                <p style={{ position: 'absolute', bottom: '24px', color: '#475569', fontSize: '15px' }}>
                    algopronos.com/code-promo-1xbet
                </p>
            </div>
        ),
        { ...size },
    );
}

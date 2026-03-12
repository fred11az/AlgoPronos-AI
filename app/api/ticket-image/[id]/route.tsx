import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Canvas size (OG standard)
const W = 1200;
const H = 630;

// ─── helpers ─────────────────────────────────────────────────────────────────

function confidenceLabel(pct: number) {
  if (pct >= 60) return { label: 'ÉLEVÉE', color: '#10B981' };
  if (pct >= 40) return { label: 'MOYENNE', color: '#F59E0B' };
  return { label: 'FAIBLE', color: '#EF4444' };
}

function selectionDisplay(value: string, type: string) {
  if (type === '1X2') {
    if (value === '1') return 'Victoire domicile';
    if (value === '2') return 'Victoire extérieur';
    return 'Match nul';
  }
  if (type === 'Double Chance') {
    if (value === '1X') return 'Dom. ou Nul';
    return 'Ext. ou Nul';
  }
  if (type === 'Over/Under') return `Plus de ${value}`;
  return value;
}

// ─── route ───────────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const adminSupabase = createAdminClient();

    // Try daily ticket first, then combine
    let picks: { homeTeam: string; awayTeam: string; league: string; selection: { type: string; value: string; odds: number } }[] = [];
    let totalOdds = 0;
    let confidencePct = 0;
    let ticketDate = '';
    let ticketType = 'Ticket IA';

    const { data: daily } = await adminSupabase
      .from('daily_ticket')
      .select('matches, total_odds, confidence_pct, date')
      .eq('id', id)
      .single();

    if (daily) {
      picks = daily.matches || [];
      totalOdds = Number(daily.total_odds);
      confidencePct = daily.confidence_pct;
      ticketDate = new Date(daily.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      ticketType = 'Ticket IA du Jour';
    } else {
      const { data: combine } = await adminSupabase
        .from('generated_combines')
        .select('matches, total_odds, estimated_probability, created_at, parameters')
        .eq('id', id)
        .single();

      if (combine) {
        picks = (combine.matches as typeof picks) || [];
        totalOdds = Number(combine.total_odds);
        confidencePct = combine.estimated_probability;
        ticketDate = new Date(combine.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        ticketType = 'Mon Combiné IA';
      }
    }

    if (!picks.length) {
      return new Response('Ticket introuvable', { status: 404 });
    }

    const conf = confidenceLabel(confidencePct);

    // Show max 4 picks on image
    const displayPicks = picks.slice(0, 4);

    return new ImageResponse(
      (
        <div
          style={{
            width: W,
            height: H,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F2F1A 100%)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'sans-serif',
            padding: '48px',
            position: 'relative',
          }}
        >
          {/* Background decoration */}
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 320, height: 320,
            borderRadius: '50%',
            background: 'rgba(16,185,129,0.08)',
            display: 'flex',
          }} />
          <div style={{
            position: 'absolute', bottom: -60, left: -60,
            width: 240, height: 240,
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.07)',
            display: 'flex',
          }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #10B981, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontSize: 22, fontWeight: 700 }}>A</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#10B981', fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>AlgoPronos AI</span>
                <span style={{ color: '#64748B', fontSize: 13 }}>{ticketDate}</span>
              </div>
            </div>
            <div style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1.5px solid rgba(16,185,129,0.3)',
              borderRadius: 24,
              padding: '6px 18px',
              display: 'flex',
            }}>
              <span style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>🤖 {ticketType}</span>
            </div>
          </div>

          {/* Picks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {displayPicks.map((pick, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '14px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(16,185,129,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#10B981', fontSize: 13, fontWeight: 700,
                  }}>{i + 1}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#F8FAFC', fontSize: 17, fontWeight: 600 }}>
                      {pick.homeTeam} vs {pick.awayTeam}
                    </span>
                    <span style={{ color: '#64748B', fontSize: 12 }}>{pick.league}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    background: 'rgba(99,102,241,0.15)',
                    borderRadius: 8,
                    padding: '4px 12px',
                    display: 'flex',
                  }}>
                    <span style={{ color: '#818CF8', fontSize: 13, fontWeight: 500 }}>
                      {selectionDisplay(pick.selection.value, pick.selection.type)}
                    </span>
                  </div>
                  <div style={{
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: 8,
                    padding: '4px 14px',
                    display: 'flex',
                    minWidth: 60,
                    justifyContent: 'center',
                  }}>
                    <span style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                      {pick.selection.odds.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {picks.length > 4 && (
              <div style={{ color: '#64748B', fontSize: 13, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                + {picks.length - 4} autre(s) sélection(s)
              </div>
            )}
          </div>

          {/* Footer: odds + confidence */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', gap: 40 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: 12 }}>COTE TOTALE</span>
                <span style={{ color: '#F8FAFC', fontSize: 28, fontWeight: 800 }}>{totalOdds.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#64748B', fontSize: 12 }}>CONFIANCE IA</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ color: conf.color, fontSize: 28, fontWeight: 800 }}>{confidencePct}%</span>
                  <span style={{ color: conf.color, fontSize: 13, fontWeight: 600 }}>{conf.label}</span>
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
              color: '#334155', fontSize: 12,
            }}>
              <span style={{ color: '#10B981', fontWeight: 700, fontSize: 14 }}>algopronos.com</span>
              <span>Jouer responsable · 18+</span>
            </div>
          </div>
        </div>
      ),
      { width: W, height: H }
    );
  } catch (err) {
    console.error('[ticket-image]', err);
    return new Response('Erreur génération image', { status: 500 });
  }
}

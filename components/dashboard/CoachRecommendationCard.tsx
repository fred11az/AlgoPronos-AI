/**
 * Bloc "Recommandation du jour" — Assistant de pari IA (Chantier 2).
 *
 * Composant SERVEUR (pas de 'use client') : le message est récupéré côté
 * serveur via getCoachRecommendation (cache 1x/jour/cohorte), donc rendu
 * complet au premier HTML — pas de bug d'hydratation "stats à 0".
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, ShieldAlert, Star, TrendingUp } from 'lucide-react';
import {
  getCoachRecommendation,
  type CoachRecommendation,
  type RiskCohort,
} from '@/lib/services/coach-recommendation';
import { createAdminClient } from '@/lib/supabase/server';

// ─── Cohorte de risque de l'utilisateur ──────────────────────────────────────
// Déduite de son dernier combiné généré (parameters.riskLevel). Défaut: balanced.

async function resolveUserCohort(userId: string | null): Promise<RiskCohort> {
  if (!userId) return 'balanced';
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('combine_usage_log')
      .select('generated_combines ( parameters )')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    const params = (data?.generated_combines as any)?.parameters;
    const risk = params?.riskLevel;
    if (risk === 'safe' || risk === 'balanced' || risk === 'risky') return risk;
  } catch {
    // Pas d'historique — cohorte par défaut
  }
  return 'balanced';
}

// ─── Étoiles de confiance ─────────────────────────────────────────────────────

function ConfidenceStars({ pct }: { pct: number }) {
  const filled = Math.max(1, Math.min(5, Math.round(pct / 20)));
  return (
    <span className="inline-flex items-center gap-0.5" title={`Confiance: ${pct}%`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= filled ? 'text-accent fill-accent' : 'text-text-muted/40'}`}
        />
      ))}
    </span>
  );
}

const COHORT_BADGE: Record<RiskCohort, string> = {
  safe: 'Profil prudent',
  balanced: 'Profil équilibré',
  risky: 'Profil offensif',
};

// ─── Composant principal ─────────────────────────────────────────────────────

export default async function CoachRecommendationCard({ userId }: { userId: string | null }) {
  let reco: CoachRecommendation;
  try {
    const cohort = await resolveUserCohort(userId);
    reco = await getCoachRecommendation(cohort);
  } catch (err) {
    console.error('[CoachRecommendationCard] failed:', err);
    return null; // Le dashboard reste utilisable sans le bloc assistant
  }

  const dateLabel = new Date(reco.date + 'T12:00:00Z').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-secondary/10">
      <CardContent className="p-6">
        {/* En-tête */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Recommandation du jour</h2>
              <p className="text-xs text-text-muted capitalize">{dateLabel} · Assistant de pari IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{COHORT_BADGE[reco.cohort]}</Badge>
            {reco.confidencePct !== null && <ConfidenceStars pct={reco.confidencePct} />}
          </div>
        </div>

        {/* Message du coach */}
        <p className="text-white text-base leading-relaxed mb-4">
          {reco.message}
        </p>

        {/* Matchs mis en avant */}
        {reco.highlights.length > 0 && (
          <div className="space-y-2 mb-4">
            {reco.highlights.map((h) => (
              <div
                key={h.match}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-light/50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm truncate">{h.match}</p>
                  <p className="text-xs text-text-muted">{h.league} · {h.pick}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {h.valueEdge !== null && h.valueEdge > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <TrendingUp className="h-3 w-3" />
                      +{h.valueEdge}% value
                    </span>
                  )}
                  <span className="text-sm font-bold text-primary">@{h.odds.toFixed(2)}</span>
                  <ConfidenceStars pct={h.confidencePct} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conseil complémentaire (ex: pari piège) — factuel, pas alarmiste */}
        {reco.advice && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30">
            <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">{reco.advice}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

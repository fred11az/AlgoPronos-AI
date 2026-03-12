'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Info,
  Lock,
  Award,
} from 'lucide-react';
import { formatDate, formatOdds } from '@/lib/utils';
import ShareTicketButton from '@/components/shared/ShareTicketButton';
import { supabase } from '@/lib/supabase/client';

// ─── Bookmakers config ────────────────────────────────────────────────────────

const BOOKMAKERS = [
  { name: '1xBet', url: process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30' },
  { name: 'Betway', url: 'https://betway.com', color: 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30' },
  { name: 'Melbet', url: 'https://melbet.com', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30' },
  { name: 'Premier Bet', url: 'https://premierbet.com', color: 'bg-purple-600/20 text-purple-400 border-purple-600/30 hover:bg-purple-600/30' },
];

// ─── Bankroll IA ──────────────────────────────────────────────────────────────

function BankrollIA({ totalOdds, riskLevel }: { totalOdds: number; riskLevel?: string }) {
  const [budget, setBudget] = useState(10000);

  const riskPct = riskLevel === 'safe' ? 3 : riskLevel === 'risky' ? 10 : 5;
  const stake = Math.round(budget * (riskPct / 100) / 100) * 100;
  const potentialGain = Math.round(stake * totalOdds);
  const profit = potentialGain - stake;

  return (
    <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-accent" />
          Bankroll IA
          <span className="text-xs text-text-muted font-normal ml-1">— combien miser ?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-text-muted mb-1 block">Mon budget total (FCFA)</label>
          <input
            type="range"
            min={5000}
            max={500000}
            step={5000}
            value={budget}
            onChange={e => setBudget(Number(e.target.value))}
            className="w-full accent-accent h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>5 000</span>
            <span className="font-bold text-white">{budget.toLocaleString('fr-FR')} FCFA</span>
            <span>500 000</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-surface-light text-center">
            <p className="text-xs text-text-muted mb-1">Mise recommandée</p>
            <p className="font-bold text-white text-sm">{stake.toLocaleString('fr-FR')} F</p>
            <p className="text-xs text-accent">{riskPct}% du budget</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-light text-center">
            <p className="text-xs text-text-muted mb-1">Gain potentiel</p>
            <p className="font-bold text-green-400 text-sm">{potentialGain.toLocaleString('fr-FR')} F</p>
            <p className="text-xs text-text-muted">si ticket gagnant</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-light text-center">
            <p className="text-xs text-text-muted mb-1">Profit net</p>
            <p className="font-bold text-green-400 text-sm">+{profit.toLocaleString('fr-FR')} F</p>
            <p className="text-xs text-text-muted">après mise</p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-light/50">
          <Info className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
          <p className="text-xs text-text-muted">
            Risque {riskLevel === 'safe' ? 'faible' : riskLevel === 'risky' ? 'élevé' : 'moyen'} — mise suggérée à {riskPct}% de la bankroll. Ne jamais miser plus de 10%.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface MatchSelection {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime?: string;
  selection: {
    type: string;
    value: string;
    odds: number;
    reasoning?: string;
    impliedPct?: number;
    modelPct?: number | null;
    valueEdge?: number | null;
  };
}

interface MatchAnalysis {
  matchId: string;
  tacticalAnalysis?: string;
  formAnalysis?: string;
  keyPlayers?: string;
  prediction?: string;
  confidenceLevel?: number;
}

interface CombineDetail {
  id: string;
  total_odds: number;
  estimated_probability: number;
  matches: MatchSelection[];
  analysis: {
    visitor?: boolean;
    summary?: string;
    keyFactors?: string[];
    matchAnalyses?: MatchAnalysis[];
    riskAssessment?: string;
  } | null;
  parameters?: {
    riskLevel?: string;
    betType?: string;
    date?: string;
  };
  created_at: string;
}

function confidenceColor(level?: number) {
  if (!level) return 'text-text-muted';
  if (level >= 70) return 'text-green-400';
  if (level >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function riskLabel(risk?: string) {
  switch (risk) {
    case 'low': return { label: 'Faible', color: 'border-green-500/50 text-green-400' };
    case 'high': return { label: 'Élevé', color: 'border-red-500/50 text-red-400' };
    default: return { label: 'Moyen', color: 'border-yellow-500/50 text-yellow-400' };
  }
}

export default function CombineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [combine, setCombine] = useState<CombineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserTier() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
      setUserTier(profile?.tier ?? null);
    }
    fetchUserTier();
  }, []);

  useEffect(() => {
    if (!id) return;

    async function fetchCombine() {
      try {
        const res = await fetch(`/api/combines/${id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setCombine(data.combine);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCombine();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !combine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Combiné introuvable</h2>
        <p className="text-text-secondary">Ce combiné n&apos;existe pas ou a expiré.</p>
        <Button variant="gradient" asChild>
          <Link href="/dashboard/combines">Voir mes combinés</Link>
        </Button>
      </div>
    );
  }

  const risk = riskLabel(combine.parameters?.riskLevel);
  const matchAnalysesMap = new Map(
    (combine.analysis?.matchAnalyses || []).map((a) => [a.matchId, a])
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold text-white">
                  Combiné — {combine.matches?.length || 0} match{(combine.matches?.length || 0) > 1 ? 's' : ''}
                </h1>
              </div>
              <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(combine.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-primary">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-2xl font-bold">{formatOdds(combine.total_odds)}</span>
                </div>
                <p className="text-xs text-text-muted">Cote totale</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-secondary">
                  <Target className="h-4 w-4" />
                  <span className="text-2xl font-bold">{combine.estimated_probability}%</span>
                </div>
                <p className="text-xs text-text-muted">Confiance IA</p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className={risk.color}>
                  {risk.label}
                </Badge>
                <p className="text-xs text-text-muted mt-1">Risque</p>
              </div>
              {/* Confidence bar */}
              <div className="hidden md:block">
                <div className="w-28">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Confiance</span>
                    <span className={combine.estimated_probability >= 60 ? 'text-green-400' : combine.estimated_probability >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                      {combine.estimated_probability >= 60 ? 'Élevée' : combine.estimated_probability >= 40 ? 'Moyenne' : 'Faible'}
                    </span>
                  </div>
                  <div className="w-full bg-surface-light rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${combine.estimated_probability >= 60 ? 'bg-green-400' : combine.estimated_probability >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${combine.estimated_probability}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Summary — or unlock CTA for visitors */}
      {!combine.analysis || combine.analysis.visitor ? (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Analyse AlgoPronos AI</h3>
              <p className="text-sm text-text-secondary">
                Probabilité AlgoPronos AI : <span className="text-primary font-bold">{combine.estimated_probability}%</span>
              </p>
              <p className="text-sm text-text-muted mt-2">
                Connecte-toi ou crée un compte pour débloquer l&apos;analyse complète — facteurs clés, forme des équipes, évaluation des risques.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="gradient" asChild>
                <Link href="/login">Se connecter →</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/onboarding">Créer un compte</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : combine.analysis?.summary ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Analyse AlgoPronos AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-text-secondary leading-relaxed">{combine.analysis.summary}</p>

            {combine.analysis.keyFactors && combine.analysis.keyFactors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-text-muted mb-2">Facteurs clés</p>
                <ul className="space-y-1">
                  {combine.analysis.keyFactors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {combine.analysis.riskAssessment && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs font-medium text-yellow-400 mb-1">Évaluation des risques</p>
                <p className="text-sm text-text-secondary">{combine.analysis.riskAssessment}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Matches */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sélections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {combine.matches?.map((match, index) => {
            const matchAnalysis = matchAnalysesMap.get(match.matchId);
            const isLast = index === combine.matches.length - 1;

            return (
              <div key={match.matchId || index}>
                <div className="px-6 py-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    {/* Match info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{match.league}</Badge>
                        {match.kickoffTime && (
                          <span className="text-xs text-text-muted">{match.kickoffTime}</span>
                        )}
                      </div>
                      <p className="font-semibold text-white">
                        {match.homeTeam} <span className="text-text-muted font-normal">vs</span> {match.awayTeam}
                      </p>
                      {match.selection.reasoning && (
                        <p className="text-sm text-text-secondary mt-1">{match.selection.reasoning}</p>
                      )}
                    </div>

                    {/* Selection + edge data */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      <div className="text-right">
                        <p className="text-xs text-text-muted">{match.selection.type}</p>
                        <p className="font-bold text-white">{match.selection.value}</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-center min-w-[60px]">
                        <p className="text-xs text-text-muted">Cote</p>
                        <p className="font-bold text-primary">{formatOdds(match.selection.odds)}</p>
                      </div>
                      {/* Probability data */}
                      {match.selection.impliedPct !== undefined && (
                        <div className="text-center px-2 py-1.5 rounded-lg bg-surface-light min-w-[56px]">
                          <p className="text-xs text-text-muted">Prob. impl.</p>
                          <p className="text-sm font-semibold text-text-secondary">{match.selection.impliedPct}%</p>
                        </div>
                      )}
                      {match.selection.modelPct !== null && match.selection.modelPct !== undefined && (
                        <div className="text-center px-2 py-1.5 rounded-lg bg-surface-light min-w-[56px]">
                          <p className="text-xs text-text-muted">Prob. modèle</p>
                          {userTier === 'verified' ? (
                            <p className="text-sm font-semibold text-secondary">{match.selection.modelPct}%</p>
                          ) : (
                            <div className="relative">
                              <p className="text-sm font-semibold text-secondary blur-sm select-none">{match.selection.modelPct}%</p>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Lock className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {match.selection.valueEdge !== null && match.selection.valueEdge !== undefined && match.selection.valueEdge > 0 && (
                        <div className="text-center px-2 py-1.5 rounded-lg bg-success/10 border border-success/20 min-w-[56px]">
                          <p className="text-xs text-success/70">Value</p>
                          {userTier === 'verified' ? (
                            <p className="text-sm font-bold text-success">+{match.selection.valueEdge}%</p>
                          ) : (
                            <div className="relative">
                              <p className="text-sm font-bold text-success blur-sm select-none">+{match.selection.valueEdge}%</p>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Lock className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Match Analysis */}
                  {matchAnalysis && (
                    <div className="mt-3 p-3 rounded-lg bg-surface-light space-y-2">
                      {matchAnalysis.prediction && (
                        <p className="text-sm text-text-secondary">
                          <span className="text-text-muted font-medium">Prédiction : </span>
                          {matchAnalysis.prediction}
                        </p>
                      )}
                      {matchAnalysis.tacticalAnalysis && (
                        <p className="text-sm text-text-secondary">
                          <span className="text-text-muted font-medium">Tactique : </span>
                          {matchAnalysis.tacticalAnalysis}
                        </p>
                      )}
                      {matchAnalysis.confidenceLevel !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted">Confiance</span>
                          <span className={`text-sm font-bold ${confidenceColor(matchAnalysis.confidenceLevel)}`}>
                            {matchAnalysis.confidenceLevel}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!isLast && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bankroll IA */}
      {!combine.analysis?.visitor && (
        <BankrollIA
          totalOdds={combine.total_odds}
          riskLevel={combine.parameters?.riskLevel}
        />
      )}

      {/* Full Access Guarantee Badges (verified users only) */}
      {userTier === 'verified' && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Garanties Full Access actives
              <Badge variant="success" className="ml-auto text-xs">Actif</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { emoji: '🛡️', title: 'Bouclier 20 Matchs', desc: 'Remboursement si 1 erreur sur 20' },
                { emoji: '⚽', title: 'Garantie Matchs Nuls', desc: '100% remboursé si 2 nuls perdants' },
                { emoji: '💰', title: 'Cash-Back 1er Perdant', desc: 'Mise remboursée automatiquement' },
                { emoji: '⚡', title: 'Cote Boostée IA', desc: 'Accès aux cotes prioritaires' },
              ].map((g, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-surface-light">
                  <span className="text-base">{g.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{g.title}</p>
                    <p className="text-xs text-text-muted">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookmakers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            Placer ce ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary mb-4">
            Pariez sur ce combiné via l&apos;un de ces bookmakers partenaires :
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BOOKMAKERS.map(bm => (
              <a
                key={bm.name}
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${bm.color}`}
              >
                {bm.name}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-3 text-center">
            Jouez de manière responsable. Les paris comportent des risques.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-6">
        <Button variant="gradient" asChild>
          <Link href="/dashboard/generate">
            <Zap className="mr-2 h-4 w-4" />
            Nouveau Combiné
          </Link>
        </Button>
        <ShareTicketButton
          ticketId={combine.id}
          totalOdds={combine.total_odds}
          confidencePct={combine.estimated_probability}
          matchCount={combine.matches?.length || 0}
          type="combine"
          buttonVariant="outline"
          label="Partager"
        />
        <Button variant="outline" asChild>
          <Link href="/dashboard/combines">
            <ChevronRight className="mr-2 h-4 w-4" />
            Mes Combinés
          </Link>
        </Button>
      </div>
    </div>
  );
}

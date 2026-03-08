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
} from 'lucide-react';
import { formatDate, formatOdds } from '@/lib/utils';

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
    summary?: string;
    keyFactors?: string[];
    matchAnalyses?: MatchAnalysis[];
    riskAssessment?: string;
  };
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

            <div className="flex items-center gap-6">
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
                <p className="text-xs text-text-muted">Probabilité</p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className={risk.color}>
                  {risk.label}
                </Badge>
                <p className="text-xs text-text-muted mt-1">Risque</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Summary */}
      {combine.analysis?.summary && (
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
      )}

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

                    {/* Selection */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-text-muted">{match.selection.type}</p>
                        <p className="font-bold text-white">{match.selection.value}</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-center min-w-[60px]">
                        <p className="text-xs text-text-muted">Cote</p>
                        <p className="font-bold text-primary">{formatOdds(match.selection.odds)}</p>
                      </div>
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

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <Button variant="gradient" asChild>
          <Link href="/dashboard/generate">
            <Zap className="mr-2 h-4 w-4" />
            Nouveau Combiné
          </Link>
        </Button>
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

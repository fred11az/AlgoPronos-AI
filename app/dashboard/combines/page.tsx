'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import {
  Zap,
  Plus,
  Calendar,
  TrendingUp,
  Target,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { formatDate, formatOdds } from '@/lib/utils';

interface Combine {
  id: string;
  total_odds: number;
  estimated_probability: number;
  matches: Array<{
    homeTeam: string;
    awayTeam: string;
    league: string;
    selection: { type: string; value: string; odds: number };
  }>;
  created_at: string;
}

export default function CombinesPage() {
  const { t } = useI18n();
  const [combines, setCombines] = useState<Combine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCombines() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('combine_usage_log')
        .select(`
          combine:generated_combines(
            id,
            total_odds,
            estimated_probability,
            matches,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const uniqueCombines = data
        ?.map((item) => item.combine)
        .filter((c, i, arr) => c && arr.findIndex((x) => x?.id === c?.id) === i) as Combine[] || [];

      setCombines(uniqueCombines);
      setLoading(false);
    }

    fetchCombines();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            {t('combines.title')}
          </h1>
          <p className="text-text-secondary">
            {t('combines.count', { count: combines.length })}
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/dashboard/generate">
            <Plus className="mr-2 h-5 w-5" />
            {t('dashboard.quickActions.newCombine.cta')}
          </Link>
        </Button>
      </div>

      {/* Combines List */}
      {combines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('combines.empty.title')}
            </h3>
            <p className="text-text-secondary mb-6">
              {t('combines.empty.description')}
            </p>
            <Button variant="gradient" asChild>
              <Link href="/dashboard/generate">
                {t('generate.submit')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {combines.map((combine) => (
            <Card key={combine.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {t('combines.card.title', { count: combine.matches?.length || 0 })}
                        </h3>
                        <p className="text-sm text-text-muted flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(combine.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Matches preview */}
                    <div className="flex flex-wrap gap-2">
                      {combine.matches?.slice(0, 3).map((match, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {match.homeTeam} vs {match.awayTeam}
                        </Badge>
                      ))}
                      {(combine.matches?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          {t('combines.card.others', { count: (combine.matches?.length || 0) - 3 })}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-primary">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xl font-bold">
                          {formatOdds(combine.total_odds)}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{t('combines.card.totalOdds')}</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center gap-1 text-secondary">
                        <Target className="h-4 w-4" />
                        <span className="text-xl font-bold">
                          {combine.estimated_probability}%
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{t('combines.card.probability')}</p>
                    </div>

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/combines/${combine.id}`}>
                        {t('combines.card.details')}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

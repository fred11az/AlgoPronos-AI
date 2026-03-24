'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Filter, Star, Trophy, Target, Activity } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { MatchRow } from './page';
import { MatchCardPro } from '@/components/shared/MatchCardPro';

interface Props {
  matches: MatchRow[];
  today: string;
}

export default function MatchsClient({ matches, today }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSport = searchParams.get('sport') || 'football';
  const currentPage = parseInt(searchParams.get('page') || '1');

  // Build unique dates from data (Hier, Aujourd'hui, 3 days forecast)
  const dates = useMemo(() => {
    const seen = new Set<string>();
    for (const m of matches) seen.add(m.match_date);
    const sorted = Array.from(seen).sort();
    return sorted; // Contains yesterdayStr if data exists
  }, [matches]);

  // Default to today if it has matches; otherwise use the first date with data
  const [activeDate, setActiveDate] = useState<string>(() => {
    const hasToday = matches.some(m => m.match_date === today);
    if (hasToday) return today;
    const seen = new Set<string>();
    for (const m of matches) seen.add(m.match_date);
    const sorted = Array.from(seen).sort();
    return sorted[0] || today;
  });

  const filtered = useMemo(
    () => matches.filter((m) => m.match_date === activeDate),
    [matches, activeDate]
  );

  const handleSportChange = (sport: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sport', sport);
    params.set('page', '1');
    router.push(`/matchs?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/matchs?${params.toString()}`);
  };

  const sports = [
    { id: 'football', label: 'Football', icon: Trophy },
    { id: 'tennis', label: 'Tennis', icon: Target },
    { id: 'basketball', label: 'Basket', icon: Activity },
    { id: 'mma', label: 'MMA/UFC', icon: Sparkles },
  ];

  // Group by league
  const byLeague = useMemo(() => {
    const acc: Record<string, MatchRow[]> = {};
    for (const m of filtered) {
      const leagueKey =
        !m.league ||
        m.league.toLowerCase().startsWith('unknown') ||
        m.league.trim() === ''
          ? 'Autre'
          : m.league;
      if (!acc[leagueKey]) acc[leagueKey] = [];
      acc[leagueKey].push(m);
    }
    return acc;
  }, [filtered]);

  // Priority sorting
  const getLeaguePriority = (league: string, country: string): number => {
    const l = league.toLowerCase();
    const c = country.toLowerCase();

    // EXCLUSIVE check for CAF to avoid matching "Champions League"
    if (l.includes('caf champions league') || l.includes('ligue des champions caf')) return 130;
    if (l.includes('africa cup of nations') || l.includes('can')) return 120;

    // 1. UEFA Champions League / Europa (Top priority)
    if (l.includes('uefa champions league')) return 10;
    if (l.includes('champions league') && (c.includes('europe') || c === '' || c.includes('uefa'))) return 15;
    if (l.includes('uefa europa league')) return 20;
    if (l.includes('europa league') && (c.includes('europe') || c === '')) return 25;

    // 2. Top 5 European Leagues
    if (l.includes('premier league') && (c.includes('angleterre') || c.includes('england') || c === '')) return 30;
    if (l.includes('ligue 1') && (c.includes('france') || c === '')) return 40;
    if ((l.includes('laliga') || l.includes('la liga')) && (c.includes('espagne') || c.includes('spain') || c === '')) return 50;
    if (l.includes('serie a') && (c.includes('italie') || c.includes('italy') || c === '')) return 60;
    if (l.includes('bundesliga') && (c.includes('allemagne') || c.includes('germany') || c === '')) return 70;

    // 3. Other Top European
    if (l.includes('eredivisie') && (c.includes('pays-bas') || c.includes('netherlands'))) return 80;
    if (l.includes('liga portugal') || (l.includes('primeira liga') && c.includes('portugal'))) return 90;
    if (l.includes('conference league')) return 100;

    // 4. Saudi Pro League (as request for top 10 scope)
    if (l.includes('saudi pro league') || (l.includes('pro league') && c.includes('saoudite'))) return 110;

    return 1000; // Default low priority
  };

  const sortedLeagues = useMemo(() => {
    return Object.entries(byLeague).sort(([leagueA, matchesA], [leagueB, matchesB]) => {
      const scoreA = getLeaguePriority(leagueA, matchesA[0].country);
      const scoreB = getLeaguePriority(leagueB, matchesB[0].country);

      if (scoreA !== scoreB) return scoreA - scoreB;
      return leagueA.localeCompare(leagueB);
    });
  }, [byLeague]);

  function labelDate(dateStr: string): string {
    const d = new Date(dateStr);
    const todayDate = new Date(today);
    const diff = Math.round((d.getTime() - todayDate.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    if (diff === -1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <section className="max-w-5xl mx-auto px-4 pb-16">
      {/* Sport Selector Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
        {sports.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSportChange(s.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all duration-300 ${
              currentSport === s.id
                ? 'bg-primary text-background shadow-lg shadow-primary/20 scale-105'
                : 'bg-surface/50 text-text-secondary hover:text-white border border-white/5'
            }`}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Search/Filter Bar - Custom Sauced */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-2 p-1.5 bg-surface/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-x-auto hide-scrollbar">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDate(d)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeDate === d
                  ? 'bg-primary text-background shadow-lg shadow-primary/20 scale-105'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {labelDate(d)}
              <span className={`ml-2 text-[10px] ${activeDate === d ? 'opacity-80' : 'text-text-muted'}`}>
                {matches.filter((m) => m.match_date === d).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-surface/30 px-4 py-2 rounded-xl border border-white/5 text-text-muted">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium">Filtrer par championnat</span>
        </div>
      </div>

      {/* No data */}
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-surface/30 rounded-3xl border border-dashed border-white/10">
          <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-4">
             <Sparkles className="h-8 w-8 text-primary/40" />
          </div>
          <p className="text-white font-bold">Aucun match disponible</p>
          <p className="text-text-muted text-sm mt-1">L'algorithme IA génère les nouveaux pronostics chaque matin.</p>
        </div>
      )}

      {/* Matches grouped by league */}
      <div className="space-y-12">        {sortedLeagues.map(([league, leagueMatches]) => {
          const isTopLeague = getLeaguePriority(league, leagueMatches[0].country) < 100;
          return (
            <div key={league} className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${isTopLeague ? 'relative' : ''}`}>
              {isTopLeague && (
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent rounded-full hidden md:block" />
              )}
              
              {/* League header */}
              <div className="flex items-center gap-3 mb-5 group/league">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 ${isTopLeague ? 'bg-gradient-to-br from-primary/30 to-secondary/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-surface-light'}`}>
                  {isTopLeague ? <Star className="h-4 w-4 text-primary fill-primary" /> : <span className="text-[10px] font-black text-text-muted italic">IA</span>}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {/* TODO: filter by league */}}
                      className="text-sm font-black text-white hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {league}
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover/league:opacity-100 transition-opacity" />
                    </button>
                    {isTopLeague && (
                      <span className="text-[8px] font-black bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded tracking-widest uppercase">Top League</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{leagueMatches[0].country}</span>
                </div>
                <div className={`h-px flex-1 ml-4 ${isTopLeague ? 'bg-gradient-to-r from-primary/30 to-transparent' : 'bg-gradient-to-r from-white/10 to-transparent'}`} />
              </div>

              {/* Match cards */}
              <div className="grid gap-3">
                {leagueMatches.map((m) => (
                  <MatchCardPro key={m.slug} match={m} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="mt-16 flex items-center justify-center gap-4">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-3 rounded-xl bg-surface border border-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-light transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="px-6 py-2 rounded-xl bg-surface/50 border border-white/5 text-sm font-bold text-white">
          Page {currentPage}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="p-3 rounded-xl bg-surface border border-white/5 text-white hover:bg-surface-light transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>

  );
}

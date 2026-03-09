'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { MatchRow } from './page';

interface Props {
  matches: MatchRow[];
  today: string;
}

export default function MatchsClient({ matches, today }: Props) {
  // Build unique dates from data (max 4)
  const dates = useMemo(() => {
    const seen = new Set<string>();
    for (const m of matches) seen.add(m.match_date);
    return Array.from(seen).sort().slice(0, 4);
  }, [matches]);

  const [activeDate, setActiveDate] = useState<string>(dates[0] || today);

  const filtered = useMemo(
    () => matches.filter((m) => m.match_date === activeDate),
    [matches, activeDate]
  );

  // Group by league
  const byLeague = useMemo(() => {
    const acc: Record<string, MatchRow[]> = {};
    for (const m of filtered) {
      if (!acc[m.league]) acc[m.league] = [];
      acc[m.league].push(m);
    }
    return acc;
  }, [filtered]);

  function labelDate(dateStr: string): string {
    const d = new Date(dateStr);
    const todayDate = new Date(today);
    const diff = Math.round((d.getTime() - todayDate.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function predLabel(type: string): string {
    if (type === 'home') return '1';
    if (type === 'draw') return 'N';
    if (type === 'away') return '2';
    return type;
  }

  function predColor(type: string): string {
    if (type === 'home') return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (type === 'draw') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  }

  return (
    <section className="max-w-5xl mx-auto px-4 pb-16">
      {/* Date filter tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDate(d)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              activeDate === d
                ? 'bg-primary text-background border-primary'
                : 'bg-surface text-text-secondary border-surface-light hover:border-primary/40 hover:text-white'
            }`}
          >
            {labelDate(d)}
            <span className="ml-2 text-xs opacity-70">
              ({matches.filter((m) => m.match_date === d).length})
            </span>
          </button>
        ))}
      </div>

      {/* No data */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          <p>Aucun match disponible pour cette date.</p>
          <p className="text-sm mt-2">Le cron génère les matchs chaque matin à 06h00.</p>
        </div>
      )}

      {/* Matches grouped by league */}
      <div className="space-y-8">
        {Object.entries(byLeague).map(([league, leagueMatches]) => (
          <div key={league}>
            {/* League header */}
            <div className="flex items-center gap-3 mb-3">
              <Link
                href={`/ligue/${leagueMatches[0].league_slug}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {league}
              </Link>
              <span className="text-xs text-text-muted">— {leagueMatches[0].country}</span>
              <div className="h-px flex-1 bg-surface-light" />
              <span className="text-xs text-text-muted">{leagueMatches.length} match{leagueMatches.length > 1 ? 's' : ''}</span>
            </div>

            {/* Match cards */}
            <div className="space-y-2">
              {leagueMatches.map((m) => (
                <Link
                  key={m.slug}
                  href={`/pronostic/${m.slug}`}
                  className="flex items-center gap-3 bg-surface hover:bg-surface-light rounded-xl border border-surface-light hover:border-primary/30 px-4 py-3.5 transition-all group"
                >
                  {/* Time */}
                  <span className="text-xs text-text-muted w-10 flex-shrink-0">{m.match_time}</span>

                  {/* Teams */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                      {m.home_team}
                    </span>
                    <span className="text-text-muted mx-2 text-xs">vs</span>
                    <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                      {m.away_team}
                    </span>
                  </div>

                  {/* Odds row */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-text-muted">
                    <span className="bg-surface-light rounded px-1.5 py-0.5">{m.odds_home?.toFixed(2)}</span>
                    <span className="bg-surface-light rounded px-1.5 py-0.5">{m.odds_draw?.toFixed(2)}</span>
                    <span className="bg-surface-light rounded px-1.5 py-0.5">{m.odds_away?.toFixed(2)}</span>
                  </div>

                  {/* Prediction badge */}
                  <div className={`flex-shrink-0 border rounded-lg px-2.5 py-1 text-center ${predColor(m.prediction_type)}`}>
                    <div className="text-xs font-bold leading-none">{predLabel(m.prediction_type)}</div>
                    <div className="text-[10px] opacity-70 leading-none mt-0.5">{m.probability}%</div>
                  </div>

                  {/* Value edge */}
                  {m.value_edge > 0 && (
                    <span className="hidden md:block flex-shrink-0 text-xs font-semibold text-green-400">
                      +{m.value_edge}%
                    </span>
                  )}

                  <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

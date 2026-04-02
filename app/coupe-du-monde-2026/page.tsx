import { Metadata } from 'next';
import Link from 'next/link';
import { worldCupMatches, worldCupGroups, formatWorldCupDate } from '@/lib/worldcup2026';
import { Trophy, MapPin, Clock, ArrowRight, Zap, Star, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

// ─── Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Coupe du Monde 2026 — Pronostics IA, Matchs & Groupes | AlgoPronos',
  description:
    'Tous les matchs de la Coupe du Monde 2026 avec pronostics IA, cotes, value bets et statistiques. Phase de groupes complète (48 matchs) — États-Unis, Canada, Mexique.',
  keywords: [
    'coupe du monde 2026',
    'mondial 2026 pronostics',
    'pronostic coupe du monde 2026',
    'mondial 2026 matchs',
    'coupe du monde 2026 groupes',
    'coupe du monde 2026 phase de groupes',
    'mundial 2026 pronostics ia',
    'world cup 2026 predictions ia',
    'value bet coupe du monde 2026',
    'cotes coupe du monde 2026',
    'algopronos coupe du monde',
    'pronostic mondial 2026 gratuit',
  ].join(', '),
  alternates: {
    canonical: 'https://algopronos.com/coupe-du-monde-2026',
  },
  openGraph: {
    title: 'Coupe du Monde 2026 — Pronostics IA & Matchs',
    description: '48 matchs de phase de groupes avec analyse IA, cotes et value bets.',
    type: 'website',
    url: 'https://algopronos.com/coupe-du-monde-2026',
  },
};

// ─── Schema JSON-LD ────────────────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Coupe du Monde FIFA 2026',
  description:
    '22ème édition de la Coupe du Monde FIFA. 48 équipes. 3 pays hôtes : États-Unis, Canada, Mexique.',
  startDate: '2026-06-11',
  endDate: '2026-07-19',
  location: [
    { '@type': 'Place', name: 'États-Unis' },
    { '@type': 'Place', name: 'Canada' },
    { '@type': 'Place', name: 'Mexique' },
  ],
  organizer: { '@type': 'Organization', name: 'FIFA', url: 'https://www.fifa.com' },
  url: 'https://algopronos.com/coupe-du-monde-2026',
};

// ─── Page ──────────────────────────────────────────────────────────────────

const BOOKMAKER_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';

const GROUPS = Object.keys(worldCupGroups);

export default function WorldCupIndexPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Coupe du Monde 2026</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-gradient-to-br from-amber-600/20 to-yellow-500/10 rounded-2xl border border-amber-500/20 p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Trophy className="h-64 w-64 text-amber-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-500/20 p-2 rounded-xl border border-amber-500/30">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <span className="text-amber-400 font-bold text-sm uppercase tracking-widest">
                FIFA World Cup 2026
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter mb-4">
              Coupe du Monde<br />
              <span className="text-amber-400">2026</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl leading-relaxed mb-8">
              Les pronostics IA pour tous les matchs de la Coupe du Monde 2026 — phase de groupes complète.{' '}
              <strong className="text-white">{worldCupMatches.length} matchs</strong> analysés par
              notre algorithme. États-Unis, Canada, Mexique du{' '}
              <strong className="text-white">11 juin au 19 juillet 2026</strong>.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href={BOOKMAKER_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="gradient" className="h-12 px-8 font-black uppercase tracking-wider rounded-xl gap-2 shadow-xl shadow-primary/20">
                  <Zap className="h-4 w-4" />
                  Parier sur 1xBet — Bonus 200%
                </Button>
              </Link>
              <Link href="/actualites">
                <Button variant="outline" className="h-12 px-8 font-bold uppercase tracking-wider rounded-xl gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  <Newspaper className="h-4 w-4" />
                  Actualités Mondial 2026
                </Button>
              </Link>
            </div>
          </div>
          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10">
            {[
              { label: 'Pays hôtes', value: '3', sub: 'USA · Canada · Mexique' },
              { label: 'Équipes', value: '48', sub: '16 groupes de 3' },
              { label: 'Matchs groupes', value: worldCupMatches.length.toString(), sub: 'Analysés par IA' },
              { label: 'Stades', value: '16', sub: 'Dans 3 pays' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-black text-amber-400 leading-none">{value}</div>
                <div className="text-xs font-bold text-white uppercase mt-1">{label}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Groups — all 8 groups */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">
          Phase de Groupes — Les 48 Matchs
        </h2>

        <div className="space-y-10">
          {GROUPS.map((groupKey) => {
            const group = worldCupGroups[groupKey];
            const groupMatchList = worldCupMatches.filter((m) => m.group === groupKey);

            return (
              <div key={groupKey} className="bg-surface rounded-2xl border border-surface-light overflow-hidden shadow-lg">
                {/* Group header */}
                <div className="bg-surface-light/50 px-6 py-4 flex items-center justify-between border-b border-surface-light">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <span className="text-amber-400 font-black text-lg">{groupKey}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Groupe {groupKey}</h3>
                      <p className="text-xs text-text-muted">{group.teams.join(' · ')}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-text-muted font-bold uppercase bg-surface-light/50 px-3 py-1 rounded-full border border-white/5">
                    {groupMatchList.length} matchs
                  </div>
                </div>

                {/* Group info */}
                <div className="px-6 py-3 bg-amber-500/5 border-b border-amber-500/10">
                  <p className="text-xs text-text-secondary italic">{group.description}</p>
                </div>

                {/* Matches */}
                <div className="divide-y divide-surface-light">
                  {groupMatchList.map((match) => (
                    <Link
                      key={match.slug}
                      href={`/coupe-du-monde-2026/${match.slug}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                            {match.homeTeam} <span className="text-text-muted font-normal">vs</span> {match.awayTeam}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted font-medium uppercase">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatWorldCupDate(match.date)} · {match.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {match.city}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-[10px] text-text-muted font-bold uppercase bg-surface-light px-2 py-1 rounded-lg border border-white/5 hidden md:block">
                          J{match.matchday}
                        </span>
                        <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-2xl border border-primary/30 p-8 text-center shadow-2xl shadow-primary/10">
          <Star className="h-10 w-10 text-primary mx-auto mb-4 fill-primary/20" />
          <h3 className="text-2xl font-black text-white mb-2">
            Générez votre ticket IA Mondial 2026
          </h3>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">
            Notre algorithme analyse en temps réel les cotes et statistiques pour vous proposer les meilleurs value bets de la Coupe du Monde 2026.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/">
              <Button variant="gradient" className="h-12 px-8 font-black uppercase tracking-wider rounded-xl gap-2 shadow-xl shadow-primary/20">
                <Zap className="h-4 w-4" />
                Ticket IA gratuit
              </Button>
            </Link>
            <Link href="/actualites">
              <Button variant="outline" className="h-12 px-8 font-bold uppercase tracking-wider rounded-xl gap-2 border-white/20">
                <Newspaper className="h-4 w-4" />
                Actualités Mondial 2026
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 86400;

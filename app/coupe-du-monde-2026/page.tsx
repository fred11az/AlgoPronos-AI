import { Metadata } from 'next';
import Link from 'next/link';
import { worldCupMatches, worldCupGroups } from '@/lib/worldcup2026';
import { Trophy, MapPin, Clock, ChevronRight, Zap, Users, Globe, TrendingUp, Star, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Coupe du Monde 2026 — Pronostics IA, Groupes & Matchs | AlgoPronos',
  description:
    'Pronostics Coupe du Monde 2026 générés par IA. Groupes A–H, calendrier complet, cotes en direct et tickets de paris optimisés pour USA, Canada, Mexique 2026.',
  keywords: [
    'coupe du monde 2026 pronostic',
    'mondial 2026 paris sportifs',
    'coupe du monde 2026 ia',
    'mondial 2026 groupes',
    'coupe du monde 2026 calendrier',
    'pronostic football mondial 2026',
    'coupe du monde 2026 cotes',
    'algopronos mondial 2026',
  ],
  openGraph: {
    title: 'Coupe du Monde 2026 — Pronostics IA | AlgoPronos',
    description: 'IA pronostics Coupe du Monde 2026 : groupes, calendrier, cotes et tickets optimisés.',
    type: 'website',
  },
};

const KEY_FIXTURES = [
  { home: 'Argentine', away: 'France', group: 'E', date: '26 juin 2026', slug: 'argentine-vs-france-26-juin-2026', emoji: '🔥' },
  { home: 'Espagne', away: 'Allemagne', group: 'F', date: '24 juin 2026', slug: 'espagne-vs-allemagne-24-juin-2026', emoji: '⚡' },
  { home: 'Brésil', away: 'Nigéria', group: 'D', date: '16 juin 2026', slug: 'bresil-vs-nigeria-16-juin-2026', emoji: '🌟' },
  { home: 'Portugal', away: 'Pays-Bas', group: 'G', date: '21 juin 2026', slug: 'portugal-vs-pays-bas-21-juin-2026', emoji: '⚽' },
  { home: 'Belgique', away: 'Italie', group: 'H', date: '22 juin 2026', slug: 'belgique-vs-italie-22-juin-2026', emoji: '💥' },
  { home: 'Mexique', away: 'Angleterre', group: 'B', date: '13 juin 2026', slug: 'mexique-vs-angleterre-13-juin-2026', emoji: '🎯' },
];

const GROUP_FLAGS: Record<string, string[]> = {
  A: ['🇺🇸', '🇵🇦', '🇺🇾', '🇰🇷'],
  B: ['🇲🇽', '🇯🇲', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇹🇳'],
  C: ['🇨🇦', '🇸🇦', '🇭🇷', '🇲🇦'],
  D: ['🇧🇷', '🇳🇬', '🇨🇭', '🇷🇸'],
  E: ['🇦🇷', '🇵🇪', '🇫🇷', '🇸🇪'],
  F: ['🇪🇸', '🇧🇴', '🇩🇪', '🇪🇬'],
  G: ['🇵🇹', '🇬🇭', '🇳🇱', '🇨🇱'],
  H: ['🇧🇪', '🇰🇪', '🇮🇹', '🇻🇪'],
};

function getDaysUntilWC(): number {
  const wcStart = new Date('2026-06-11T00:00:00');
  const now = new Date();
  const diff = wcStart.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const UPCOMING_COUNT = 12;

export default function CoupeDuMonde2026Page() {
  const days = getDaysUntilWC();
  const upcoming = worldCupMatches.slice(0, UPCOMING_COUNT);
  const groups = Object.entries(worldCupGroups);

  const affiliateUrl = process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || '#';

  return (
    <main className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-surface-light/50">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-background to-primary/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-semibold uppercase tracking-widest">
              <Trophy className="h-3.5 w-3.5" />
              Coupe du Monde FIFA 2026
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent">
                Mondial 2026
              </span>
              <br />
              <span className="text-white">Pronostics IA</span>
            </h1>

            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              32 équipes, 8 groupes, 48 matchs. L&apos;IA AlgoPronos analyse chaque rencontre
              pour vous fournir les meilleures cotes et value bets du tournoi.
            </p>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface border border-yellow-400/30">
                <Clock className="h-5 w-5 text-yellow-400 shrink-0" />
                <div className="text-left">
                  <div className="text-3xl font-black text-yellow-400 leading-none">J-{days}</div>
                  <div className="text-xs text-text-muted mt-0.5">avant le coup d&apos;envoi</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-sm text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <span>11 juin – 19 juillet 2026</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>USA · Canada · Mexique</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button variant="gradient" size="lg" asChild>
                <Link href="/dashboard/generate">
                  <Zap className="mr-2 h-5 w-5" />
                  Générer mon ticket Mondial
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/pronostics">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Voir les pronostics
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-surface-light/50 bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Équipes', value: '32', icon: Users },
              { label: 'Groupes', value: '8', icon: Trophy },
              { label: 'Matchs', value: '48', icon: Star },
              { label: 'Pays hôtes', value: '3', icon: Globe },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="h-5 w-5 text-yellow-400" />
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs text-text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Groupes A–H */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Les 8 Groupes</h2>
            <span className="text-sm text-text-muted hidden sm:block">Phase de groupes · 11–30 juin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {groups.map(([letter, group]) => (
              <div
                key={letter}
                className="bg-surface border border-surface-light/50 rounded-2xl p-5 hover:border-yellow-400/40 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
                    <span className="text-yellow-400 font-black text-sm">G{letter}</span>
                  </div>
                  <span className="text-xs text-text-muted font-medium">Groupe {letter}</span>
                </div>

                <div className="space-y-2 mb-3">
                  {group.teams.map((team, idx) => (
                    <div key={team} className="flex items-center gap-2 text-sm">
                      <span>{GROUP_FLAGS[letter]?.[idx] ?? '🌍'}</span>
                      <span className="text-text-secondary">{team}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-text-muted leading-relaxed border-t border-surface-light/50 pt-3">
                  {group.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Affiches à ne pas manquer */}
      <section className="py-12 bg-surface/30 border-y border-surface-light/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Flame className="h-6 w-6 text-orange-400" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">Affiches à ne pas manquer</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KEY_FIXTURES.map((fixture) => (
              <Link
                key={fixture.slug}
                href={`/coupe-du-monde-2026/${fixture.slug}`}
                className="group bg-surface border border-surface-light/50 rounded-2xl p-5 hover:border-primary/50 hover:bg-surface-light/20 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{fixture.emoji}</span>
                  <span className="text-xs text-text-muted bg-surface-light/50 px-2 py-1 rounded-full">
                    Groupe {fixture.group}
                  </span>
                </div>
                <div className="font-bold text-white text-lg mb-1">
                  {fixture.home} <span className="text-text-muted font-normal text-sm">vs</span> {fixture.away}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{fixture.date}</span>
                  <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prochains matchs */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Prochains matchs</h2>
            <span className="text-sm text-text-muted">{worldCupMatches.length} matchs au total</span>
          </div>

          <div className="space-y-3">
            {upcoming.map((match) => (
              <Link
                key={match.slug}
                href={`/coupe-du-monde-2026/${match.slug}`}
                className="group flex items-center justify-between bg-surface border border-surface-light/50 rounded-xl px-5 py-4 hover:border-primary/40 hover:bg-surface-light/10 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="hidden sm:flex flex-col items-center text-xs text-text-muted w-14 shrink-0">
                    <span>{new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    <span className="font-semibold text-text-secondary">{match.time}</span>
                  </div>
                  <div className="w-px h-8 bg-surface-light/50 hidden sm:block shrink-0" />
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="font-semibold text-white truncate">{match.homeTeam}</span>
                    <span className="text-xs text-text-muted shrink-0">vs</span>
                    <span className="font-semibold text-white truncate">{match.awayTeam}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden md:block text-xs text-text-muted">{match.city}</span>
                  <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                    G{match.group}
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          {worldCupMatches.length > UPCOMING_COUNT && (
            <div className="mt-6 text-center">
              <p className="text-sm text-text-muted">
                + {worldCupMatches.length - UPCOMING_COUNT} autres matchs disponibles via les groupes ci-dessus
              </p>
            </div>
          )}
        </div>
      </section>

      {/* IA Pronostics CTA */}
      <section className="py-12 bg-surface/30 border-y border-surface-light/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
            <Zap className="h-3.5 w-3.5" />
            Intelligence Artificielle
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Pronostics Mondial 2026 générés par IA
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Notre IA analyse les statistiques, les cotes des bookmakers et les tendances
            pour générer des tickets optimisés sur chaque match du Mondial 2026.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { title: 'Ticket Classique', desc: '3–4 sélections, cote 1.40–2.10', icon: '🎯' },
              { title: 'Ticket Optimus', desc: 'Value bets, cote totale 4.50–8.00', icon: '⚡' },
              { title: 'Ticket Montante', desc: 'Ultra-sécurisé, Double Chance', icon: '🔒' },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="bg-surface border border-surface-light/50 rounded-xl p-4 text-left">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-semibold text-white text-sm mb-1">{title}</div>
                <div className="text-xs text-text-muted">{desc}</div>
              </div>
            ))}
          </div>

          <Button variant="gradient" size="lg" asChild>
            <Link href="/dashboard/generate">
              <Zap className="mr-2 h-5 w-5" />
              Générer mon ticket Mondial 2026
            </Link>
          </Button>
        </div>
      </section>

      {/* 1xBet Affiliate Block */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#1a472a]/80 via-surface to-[#1a472a]/60 border border-[#2d6a4f]/50 p-8 md:p-10 text-center">
            <div className="text-4xl mb-4">⚽</div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              Pariez sur la Coupe du Monde 2026
            </h3>
            <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
              Utilisez nos pronostics IA sur les meilleures cotes. Pariez responsablement.
            </p>
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Ouvrir un compte 1xBet
              <ChevronRight className="h-4 w-4" />
            </a>
            <p className="text-xs text-text-muted mt-4">
              18+ · Jouez responsablement · Les paris peuvent créer une dépendance
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  worldCupMatches,
  getMatchBySlug,
  getMatchesByGroup,
  formatWorldCupDate,
  worldCupGroups,
} from '@/lib/worldcup2026';
import {
  Trophy,
  MapPin,
  Clock,
  ChevronRight,
  ArrowRight,
  Zap,
  Users,
  Star,
  TrendingUp,
  Target,
  Brain,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Static Generation ──────────────────────────────────────────────────────

export async function generateStaticParams() {
  return worldCupMatches.map((m) => ({ slug: m.slug }));
}

// ─── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const match = getMatchBySlug(slug);

  if (!match) {
    return { title: 'Match — Coupe du Monde 2026 | AlgoPronos' };
  }

  const dateFormatted = formatWorldCupDate(match.date);

  return {
    title: `${match.homeTeam} vs ${match.awayTeam} — Coupe du Monde 2026 Groupe ${match.group} | AlgoPronos`,
    description: `Pronostic IA et analyse du match ${match.homeTeam} vs ${match.awayTeam} — Coupe du Monde 2026, Groupe ${match.group}, le ${dateFormatted} à ${match.city}. Value bets, cotes, statistiques et ticket IA.`,
    keywords: [
      `${match.homeTeam.toLowerCase()} vs ${match.awayTeam.toLowerCase()} coupe du monde 2026`,
      `pronostic ${match.homeTeam.toLowerCase()} ${match.awayTeam.toLowerCase()}`,
      `coupe du monde 2026 groupe ${match.group.toLowerCase()}`,
      `mondial 2026 ${match.homeTeam.toLowerCase()}`,
      `mondial 2026 ${match.awayTeam.toLowerCase()}`,
      'pronostic coupe du monde 2026',
      'coupe du monde 2026 pronostic ia',
      'mondial 2026 analyse ia',
      'value bet mondial 2026',
      'cotes coupe du monde 2026',
    ].join(', '),
    alternates: {
      canonical: `https://algopronos.com/coupe-du-monde-2026/${slug}`,
    },
    openGraph: {
      title: `${match.homeTeam} vs ${match.awayTeam} — Mondial 2026`,
      description: `Analyse IA du match ${match.homeTeam} vs ${match.awayTeam} — Groupe ${match.group} le ${dateFormatted}.`,
      type: 'article',
      url: `https://algopronos.com/coupe-du-monde-2026/${slug}`,
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────

const BOOKMAKER_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';

export default async function WorldCupMatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = getMatchBySlug(slug);

  if (!match) notFound();

  const groupMatches = getMatchesByGroup(match.group).filter((m) => m.slug !== slug);
  const groupInfo = worldCupGroups[match.group];
  const dateFormatted = formatWorldCupDate(match.date);

  // JSON-LD SportsEvent schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${match.homeTeam} vs ${match.awayTeam}`,
    description: `Coupe du Monde FIFA 2026 — Groupe ${match.group}`,
    startDate: `${match.date}T${match.time}:00`,
    location: {
      '@type': 'Place',
      name: match.venue,
      address: { '@type': 'PostalAddress', addressLocality: match.city },
    },
    organizer: { '@type': 'Organization', name: 'FIFA' },
    competitor: [
      { '@type': 'SportsTeam', name: match.homeTeam },
      { '@type': 'SportsTeam', name: match.awayTeam },
    ],
    url: `https://algopronos.com/coupe-du-monde-2026/${slug}`,
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-text-muted flex-wrap">
          <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/coupe-du-monde-2026" className="hover:text-white transition-colors">
            Coupe du Monde 2026
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-secondary">{match.homeTeam} vs {match.awayTeam}</span>
        </nav>
      </div>

      {/* Hero — Match Card */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="bg-surface rounded-2xl border border-surface-light overflow-hidden shadow-xl">
          {/* Competition bar */}
          <div className="bg-gradient-to-r from-amber-600/30 to-yellow-500/20 px-6 py-3 flex items-center justify-between border-b border-amber-500/20">
            <Link
              href="/coupe-du-monde-2026"
              className="flex items-center gap-2 text-sm text-amber-300 hover:text-amber-100 transition-colors font-bold"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              Coupe du Monde FIFA 2026 — Groupe {match.group}
            </Link>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Journée {match.matchday}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {match.city}, {match.country}
              </span>
            </div>
          </div>

          {/* Teams */}
          <div className="px-6 py-12 md:py-16">
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 text-3xl font-black shadow-inner">
                  {match.homeTeam[0]}
                </div>
                <h1 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight uppercase">
                  {match.homeTeam}
                </h1>
              </div>

              <div className="text-center flex flex-col items-center gap-3">
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  MONDIAL 2026
                </div>
                <div className="text-4xl md:text-6xl font-black text-white/10 italic select-none">VS</div>
                <div className="text-xs text-text-muted font-bold bg-surface-light px-3 py-1 rounded-full border border-white/5">
                  {dateFormatted}
                </div>
                <div className="text-xs text-text-muted">{match.time} · {match.venue}</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 text-3xl font-black shadow-inner">
                  {match.awayTeam[0]}
                </div>
                <h1 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight uppercase">
                  {match.awayTeam}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* IA Ticket CTA — Primary conversion block */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/10 rounded-3xl border border-primary/30 p-8 relative overflow-hidden shadow-2xl shadow-primary/10">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Trophy className="h-32 w-32 text-primary" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/30">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                    Ticket IA — {match.homeTeam} vs {match.awayTeam}
                  </h2>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">
                    Analyse Algorithmique Mondial 2026
                  </p>
                </div>
              </div>

              <div className="bg-background/60 backdrop-blur-xl rounded-2xl p-6 border border-primary/20 mb-6">
                <p className="text-text-secondary leading-relaxed text-base">
                  Notre algorithme IA analyse en temps réel les statistiques de{' '}
                  <strong className="text-white">{match.homeTeam}</strong> et{' '}
                  <strong className="text-white">{match.awayTeam}</strong> pour ce match de
                  Groupe {match.group} du Mondial 2026. Forme récente, confrontations directes,
                  contexte de qualification, cotes value betting — tout est calculé pour maximiser
                  vos chances de gain.
                </p>
                <div className="mt-4 flex gap-4 text-xs font-bold text-text-muted uppercase">
                  <span className="flex items-center gap-1"><Target className="h-3 w-3 text-primary" /> Value Bets</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-secondary" /> Cotes optimisées</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400 fill-amber-400" /> 1xBet Bonus 200%</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="gradient" className="w-full h-14 text-base font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform" asChild>
                  <Link href={BOOKMAKER_URL} target="_blank" rel="noopener noreferrer">
                    Parier sur ce match avec 1xBet
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full h-12 font-bold uppercase tracking-wider rounded-2xl border-primary/30 text-primary hover:bg-primary/10" asChild>
                  <Link href="/">
                    Générer mon ticket IA gratuit
                  </Link>
                </Button>
                <p className="text-[10px] text-text-muted text-center italic">
                  Code promo ALGO à l'inscription 1xBet pour débloquer le bonus 200%.
                </p>
              </div>
            </div>

            {/* Match Analysis */}
            <div className="bg-surface rounded-2xl border border-surface-light p-8 shadow-lg space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
                Contexte du match — Groupe {match.group}
              </h2>

              {groupInfo && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-text-secondary leading-relaxed">{groupInfo.description}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-surface-light/30 border border-white/5">
                  <div className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {match.homeTeam}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Équipe à domicile pour ce match de Groupe {match.group}. Jouera au{' '}
                    <strong className="text-white">{match.venue}</strong> à{' '}
                    <strong className="text-white">{match.city}</strong>, ville hôte{' '}
                    {match.country === 'USA'
                      ? 'américaine'
                      : match.country === 'Canada'
                      ? 'canadienne'
                      : 'mexicaine'}.
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-surface-light/30 border border-white/5">
                  <div className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    {match.awayTeam}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Équipe visiteuse pour ce match de la Journée {match.matchday} du Groupe{' '}
                    {match.group}. Ce match se joue dans la ville de{' '}
                    <strong className="text-white">{match.city}</strong> lors de la phase de
                    groupes du Mondial 2026.
                  </p>
                </div>
              </div>

              {/* Key facts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Groupe', value: match.group, icon: Trophy },
                  { label: 'Journée', value: match.matchday.toString(), icon: Star },
                  { label: 'Ville', value: match.city, icon: MapPin },
                  { label: 'Heure', value: `${match.time} UTC`, icon: Clock },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-3 rounded-xl bg-surface-light/20 border border-white/5 text-center">
                    <Icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{label}</div>
                    <div className="text-sm font-black text-white mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Autres matchs du groupe — Internal linking */}
            {groupMatches.length > 0 && (
              <div className="bg-surface rounded-2xl border border-surface-light p-8 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <Users className="h-5 w-5 text-secondary" />
                  Autres matchs du Groupe {match.group}
                </h2>
                <div className="space-y-3">
                  {groupMatches.map((gm) => (
                    <Link
                      key={gm.slug}
                      href={`/coupe-du-monde-2026/${gm.slug}`}
                      className="flex items-center justify-between bg-surface-light/30 hover:bg-white/5 rounded-xl p-4 transition-all border border-white/5 group"
                    >
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                          {gm.homeTeam} vs {gm.awayTeam}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          J{gm.matchday} · {formatWorldCupDate(gm.date)} · {gm.city}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* ── Compte Optimisé IA — CTA n°1 ── */}
            <div className="bg-surface rounded-2xl border border-primary/30 overflow-hidden shadow-2xl shadow-primary/10 lg:sticky lg:top-6">
              <div className="bg-gradient-to-r from-primary to-secondary px-4 py-2.5 flex items-center gap-2">
                <Brain className="h-4 w-4 text-white" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest flex-1">Compte Optimisé IA</span>
                <span className="text-[9px] font-black text-white/80 bg-white/15 px-2 py-0.5 rounded-full">GRATUIT</span>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-black text-white mb-1 leading-snug">
                  Pariez sur {match.homeTeam} vs {match.awayTeam} avec l'IA
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-3">
                  Créez votre compte 1xBet avec le code{' '}
                  <span className="font-mono font-black text-primary">ALGOPRONOS</span> pour
                  accéder aux analyses IA, tickets quotidiens et value bets du Mondial 2026.
                </p>
                <ul className="space-y-1.5 mb-4">
                  {[
                    'Ticket IA quotidien',
                    'Value bets détectés auto',
                    'Bonus 200% majoré',
                    '100% gratuit',
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-[11px] text-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="/compte-optimise-ia">
                  <Button variant="gradient" className="w-full h-11 font-black text-xs uppercase tracking-wider rounded-xl gap-2 shadow-xl shadow-primary/20 mb-2">
                    <Rocket className="h-4 w-4" />
                    Créer mon Compte IA
                  </Button>
                </Link>
                <Link href={BOOKMAKER_URL} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full h-9 font-bold text-[11px] uppercase tracking-wide rounded-xl gap-2 border-white/10 text-text-muted hover:text-primary hover:border-primary/30">
                    Ouvrir 1xBet directement
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Toutes les équipes du groupe */}
            {groupInfo && (
              <div className="bg-surface rounded-3xl border border-surface-light p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Groupe {match.group} — équipes
                </h3>
                <div className="space-y-2">
                  {groupInfo.teams.map((team, i) => (
                    <div
                      key={team}
                      className={`flex items-center gap-3 p-2.5 rounded-lg ${
                        team === match.homeTeam || team === match.awayTeam
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-surface-light/20 border border-white/5'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-text-muted">
                        {i + 1}
                      </span>
                      <span className={`text-sm font-bold ${
                        team === match.homeTeam || team === match.awayTeam
                          ? 'text-primary'
                          : 'text-text-secondary'
                      }`}>
                        {team}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link to index */}
            <div className="bg-surface rounded-3xl border border-surface-light p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-3">Tous les matchs</h3>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                Retrouvez l'ensemble des 48 matchs de la phase de groupes du Mondial 2026.
              </p>
              <Link href="/coupe-du-monde-2026">
                <Button variant="outline" className="w-full h-10 font-bold text-xs uppercase tracking-wide rounded-xl border-white/10 hover:border-primary/30 hover:text-primary">
                  Voir tous les matchs
                </Button>
              </Link>
            </div>

            {/* Responsible gambling */}
            <div className="bg-surface-light/20 rounded-2xl p-4 border border-white/5">
              <p className="text-[10px] text-text-muted leading-relaxed italic">
                Les jeux d'argent comportent des risques. Ne misez jamais plus que ce que vous pouvez vous permettre de perdre. 18+.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 86400; // Static page, revalidate once per day

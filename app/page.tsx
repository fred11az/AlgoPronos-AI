import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Rocket,
  ArrowRight,
  Shield,
  Brain,
  BarChart3,
  Target,
  TrendingUp,
  CheckCircle2,
  Zap,
  Activity,
  Database,
  LineChart,
  Users,
} from 'lucide-react';
import { HeroTicketPreview } from '@/components/landing/HeroTicketPreview';
import { StatsBar } from '@/components/landing/StatsBar';
import { LiveTicketSection } from '@/components/landing/LiveTicketSection';
import { ClassementPreview } from '@/components/landing/ClassementPreview';
import { BookmakersSection } from '@/components/landing/BookmakersSection';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqItems = [
  {
    question: 'Comment l\'algorithme sélectionne-t-il les picks ?',
    answer:
      "L'algorithme calcule la probabilité implicite de chaque cote bookmaker, puis la compare à la probabilité estimée par le modèle statistique (données API-Football). Il sélectionne les marchés où l'écart (value edge) est le plus favorable selon votre niveau de risque choisi.",
  },
  {
    question: 'D\'où viennent les données utilisées ?',
    answer:
      "Les matchs et cotes proviennent de deux sources : API-Football (cotes Bet365 en temps réel, probabilités, forme des équipes, xG) et TheSportsDB (couverture élargie). Les données sont mises en cache 12h pour garantir la rapidité.",
  },
  {
    question: 'Que signifie "value edge" ?',
    answer:
      "Le value edge (avantage de valeur) est la différence entre la probabilité estimée par notre modèle et la probabilité implicite du bookmaker. Un edge positif de +8% signifie que notre modèle estime la probabilité à 8 points au-dessus de ce que le bookmaker pense. C'est un indicateur de paris sous-cotés.",
  },
  {
    question: 'L\'accès est-il vraiment gratuit ?',
    answer:
      "Oui. L'accès complet est gratuit via création d'un compte 1xBet via notre lien partenaire. Sans compte, vous disposez d'une analyse IA par semaine pour tester la plateforme.",
  },
  {
    question: 'Combien de temps prend la génération d\'un ticket ?',
    answer:
      "La génération est généralement effectuée en moins de 15 secondes : récupération des matchs, calcul statistique, sélection algorithmique des picks, et rédaction de l'analyse par l'IA (Groq LLaMA). Les résultats sont ensuite mis en cache 48h.",
  },
  {
    question: 'Les résultats passés sont-ils visibles ?',
    answer:
      "Oui. L'historique complet des tickets IA quotidiens est public et consultable. Chaque ticket affiche la date, les sélections, la cote totale et le statut (gagné/perdu/en cours). Aucun résultat n'est masqué.",
  },
];

// ─── Data signals ─────────────────────────────────────────────────────────────

const DATA_SIGNALS = [
  {
    icon: Activity,
    title: 'Forme des équipes',
    description: 'Analyse des 5 derniers matchs : résultats, buts marqués/encaissés, séquences.',
    source: 'API-Football',
  },
  {
    icon: LineChart,
    title: 'Statistiques xG',
    description: 'Expected Goals (xG) pour mesurer la qualité réelle des occasions, indépendamment du score.',
    source: 'API-Football',
  },
  {
    icon: Database,
    title: 'Cotes bookmakers',
    description: 'Cotes Bet365 en temps réel converties en probabilité implicite pour chaque marché.',
    source: 'Bet365 / API-Football',
  },
  {
    icon: TrendingUp,
    title: 'Value betting',
    description: 'Calcul de l\'écart entre probabilité modèle et probabilité implicite bookmaker (value edge).',
    source: 'Algorithme AlgoPronos',
  },
  {
    icon: BarChart3,
    title: 'Probabilités du modèle',
    description: 'Probabilités de victoire/nul/défaite issues du modèle prédictif API-Football.',
    source: 'API-Football Predictions',
  },
  {
    icon: Target,
    title: 'Sélection par niveau de risque',
    description: 'Prudent (Double Chance, cotes basses), Équilibré (value bet), Risqué (high edge + high odds).',
    source: 'Algorithme AlgoPronos',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* ─── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-80 h-80 bg-primary rounded-full mix-blend-multiply filter blur-[120px] animate-blob" />
          <div className="absolute top-40 right-10 w-80 h-80 bg-secondary rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-primary text-sm font-medium">
                  Outil d&apos;analyse statistique — API-Football + Groq LLaMA
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Optimisez vos paris{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
                  sportifs avec l&apos;IA
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-xl leading-relaxed">
                L&apos;algorithme analyse les statistiques, les cotes et la forme des équipes
                pour générer des combinés optimisés. Données réelles, raisonnement transparent.
              </p>

              {/* Feature bullets */}
              <div className="space-y-3 mb-10">
                {[
                  { icon: Database, text: 'Données API-Football + TheSportsDB en temps réel' },
                  { icon: TrendingUp, text: 'Calcul de value edge (probabilité modèle vs bookmaker)' },
                  { icon: Zap, text: 'Analyse et ticket générés en moins de 15 secondes' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3 text-text-secondary">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" variant="gradient" asChild>
                  <Link href="/dashboard/generate">
                    <Rocket className="mr-2 h-5 w-5" />
                    Générer mon ticket IA
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/api/try-free">
                    Essayer sans compte
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-5 mt-8 text-sm text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Accès gratuit via 1xBet
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Historique public vérifiable
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-secondary" />
                  +15 000 utilisateurs actifs
                </div>
              </div>
            </div>

            {/* Right — generator UI mockup */}
            <div className="hidden lg:flex justify-center">
              <HeroTicketPreview />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-text-muted/40 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-3 bg-text-muted/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────────────────────────── */}
      <StatsBar />

      {/* ─── COMMENT ÇA MARCHE ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Comment ça marche</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                De la sélection à l&apos;analyse en 3 étapes
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                L&apos;algorithme s&apos;adapte à vos préférences et au contexte de chaque match.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                num: '1',
                icon: Target,
                title: 'Sélectionnez vos matchs',
                desc: "Parcourez les matchs du jour issus de API-Football et TheSportsDB. Choisissez vos championnats et les rencontres qui vous intéressent.",
                detail: 'Premier League, La Liga, Ligue 1, CAN, Champions League...',
                color: 'from-primary to-primary/50',
              },
              {
                num: '2',
                icon: Shield,
                title: 'Choisissez votre niveau de risque',
                desc: "Prudent (Double Chance, cotes 1.2–2.0), Équilibré (value bets, cotes 2.0–4.0), Risqué (edge élevé, cotes 4.0+).",
                detail: "L'algorithme adapte la sélection des marchés en conséquence.",
                color: 'from-secondary to-secondary/50',
              },
              {
                num: '3',
                icon: Brain,
                title: 'L\'IA génère un combiné optimisé',
                desc: "L'algorithme sélectionne le marché optimal (1X2, Double Chance, Over/Under) et Groq LLaMA rédige l'analyse pour chaque pick.",
                detail: 'Probabilité implicite, value edge et raisonnement affichés.',
                color: 'from-accent to-accent/50',
              },
            ].map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <div className="group relative">
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {step.num}
                  </div>
                  <div className="w-10 h-10 bg-surface-light rounded-xl flex items-center justify-center mb-4 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-text-secondary leading-relaxed mb-3">{step.desc}</p>
                  <p className="text-xs text-text-muted bg-surface-light rounded-lg px-3 py-2">{step.detail}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DONNÉES ANALYSÉES ────────────────────────────────────────────────── */}
      <section id="data" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Données analysées</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                6 signaux pour chaque ticket
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                L&apos;algorithme combine données réelles et calcul statistique pour identifier
                les meilleures opportunités de value betting.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DATA_SIGNALS.map((signal, i) => (
              <ScrollReveal key={i} delay={(i % 3) * 0.1}>
                <div className="group bg-surface border border-surface-light rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <signal.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{signal.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-3">{signal.description}</p>
                  <div className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface-light px-2 py-1 rounded-md">
                    <Database className="h-3 w-3" />
                    {signal.source}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Architecture note */}
          <ScrollReveal delay={0.3}>
            <div className="mt-12 bg-surface border border-surface-light rounded-2xl p-6 max-w-3xl mx-auto">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Architecture technique
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                {[
                  { label: 'Données matchs', value: 'API-Football + TheSportsDB', color: 'text-primary' },
                  { label: 'Analyse IA', value: 'Groq LLaMA 3.3-70b', color: 'text-secondary' },
                  { label: 'Cache données', value: '12h (matchs) / 48h (tickets)', color: 'text-accent' },
                ].map((item, i) => (
                  <div key={i} className="bg-background/60 rounded-xl p-3">
                    <div className="text-text-muted text-xs mb-1">{item.label}</div>
                    <div className={`font-semibold ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── TICKET DU JOUR (LIVE) ────────────────────────────────────────────── */}
      <LiveTicketSection />

      {/* ─── HISTORIQUE / CLASSEMENT ──────────────────────────────────────────── */}
      <ClassementPreview />

      {/* ─── BOOKMAKERS ───────────────────────────────────────────────────────── */}
      <BookmakersSection />

      {/* ─── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Questions fréquentes</h2>
            </div>
          </ScrollReveal>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-surface rounded-xl px-6 border border-surface-light hover:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-text-secondary leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              Prêt à analyser vos prochains paris ?
            </h2>
            <p className="text-text-secondary text-lg mb-10 max-w-2xl mx-auto">
              Générez votre premier ticket IA gratuitement. Données réelles,
              algorithme transparent, analyse Groq LLaMA incluse.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="gradient" asChild>
                <Link href="/dashboard/generate">
                  <Rocket className="mr-2 h-5 w-5" />
                  Générer mon ticket IA
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/dashboard/history">
                  Voir l&apos;historique
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}

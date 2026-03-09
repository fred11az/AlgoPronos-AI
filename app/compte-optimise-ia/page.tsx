import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  ArrowRight,
  Brain,
  TrendingUp,
  Target,
  Shield,
  Zap,
  BarChart3,
  CheckCircle2,
  Star,
  Users,
  ChevronRight,
} from 'lucide-react';
import { BookmakerSelector, BookmakerAffiliateButtons } from './BookmakerSelector';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { LiveTicketSection } from '@/components/landing/LiveTicketSection';
import { VerificateurWidget } from '@/components/landing/VerificateurWidget';

// ─── SEO Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Compte optimisé IA pour paris sportifs | AlgoPronos',
  description:
    "Créez votre compte bookmaker optimisé par IA. Notre algorithme analyse les statistiques, cotes et forme des équipes pour générer des combinés gagnants. Gratuit, sans abonnement.",
  keywords: [
    'compte optimisé paris sportifs',
    'IA paris sportifs',
    'algorithme pronostics football',
    'générateur combiné IA',
    'value betting Afrique',
    'pronostics football IA',
    'compte 1xBet optimisé',
    'paris sportifs algorithme',
    'combiné optimisé bookmaker',
    'analyse cotes IA',
  ].join(', '),
  openGraph: {
    title: 'Compte optimisé IA pour paris sportifs | AlgoPronos',
    description:
      "Notre algorithme IA analyse les statistiques, les cotes et la forme des équipes pour générer des combinés optimisés directement sur votre bookmaker.",
    type: 'website',
  },
};

// ─── Avantages ─────────────────────────────────────────────────────────────────

const ADVANTAGES = [
  {
    icon: Brain,
    title: 'Analyse automatisée des matchs',
    description:
      "L'algorithme traite automatiquement les statistiques, la forme des équipes et les données de chaque rencontre. Aucune recherche manuelle nécessaire.",
    color: 'text-primary',
    bg: 'bg-primary/10 group-hover:bg-primary',
  },
  {
    icon: TrendingUp,
    title: 'Détection de value bets',
    description:
      "Identification des marchés où la cote bookmaker est supérieure à la probabilité réelle estimée — les opportunités que la plupart des parieurs ignorent.",
    color: 'text-secondary',
    bg: 'bg-secondary/10 group-hover:bg-secondary',
  },
  {
    icon: Target,
    title: 'Gestion du risque personnalisée',
    description:
      "Trois profils disponibles : Prudent, Équilibré, Risqué. L'algorithme adapte la sélection des marchés et les types de paris à votre stratégie.",
    color: 'text-accent',
    bg: 'bg-accent/10 group-hover:bg-accent',
  },
  {
    icon: Zap,
    title: 'Génération rapide de combinés',
    description:
      "Sélectionnez vos matchs, choisissez votre niveau de risque, et recevez votre combiné optimisé avec analyse complète en moins de 15 secondes.",
    color: 'text-success',
    bg: 'bg-success/10 group-hover:bg-success',
  },
];

// ─── Étapes ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '1',
    icon: Shield,
    title: 'Créez votre compte bookmaker',
    description:
      "Choisissez votre bookmaker parmi nos partenaires et ouvrez votre compte. Profitez du bonus de bienvenue et activez votre accès AlgoPronos.",
    note: "Le lien d'activation s'affiche après sélection du bookmaker ci-dessous.",
    color: 'from-primary to-primary/50',
  },
  {
    num: '2',
    icon: Brain,
    title: 'Accédez au générateur AlgoPronos',
    description:
      "Une fois votre compte créé, revenez sur AlgoPronos et connectez-vous. Le générateur IA est immédiatement disponible.",
    note: 'Accès complet et gratuit — sans abonnement.',
    color: 'from-secondary to-secondary/50',
  },
  {
    num: '3',
    icon: BarChart3,
    title: 'L\'IA génère vos tickets optimisés',
    description:
      "Sélectionnez vos matchs, choisissez votre niveau de risque, et l'algorithme génère un combiné optimisé avec analyse détaillée pour chaque pick.",
    note: 'Probabilité estimée et indicateur de valeur affichés pour chaque sélection.',
    color: 'from-accent to-accent/50',
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CompteOptimiseIAPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-[130px] animate-blob" />
          <div className="absolute top-60 right-10 w-80 h-80 bg-secondary rounded-full mix-blend-multiply filter blur-[130px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-[130px] animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-4 py-2 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-success text-sm font-medium">
              Accès gratuit — Actif maintenant
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Créez votre compte de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              paris optimisé par IA
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
            Notre algorithme analyse les statistiques, les cotes et la forme des équipes
            pour générer des paris optimisés directement sur votre bookmaker.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm text-text-muted">
            {[
              { icon: Shield, text: '100% gratuit' },
              { icon: Star, text: 'Sans abonnement' },
              { icon: Users, text: '+15 000 utilisateurs' },
              { icon: CheckCircle2, text: 'Historique public' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="gradient" asChild>
              <a href="#bookmakers">
                <Rocket className="mr-2 h-5 w-5" />
                Créer mon compte optimisé
              </a>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/dashboard/generate">
                Accéder au générateur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── QU'EST-CE QU'UN COMPTE OPTIMISÉ IA ? ───────────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <ScrollReveal direction="left">
              <Badge variant="outline" className="mb-5">Le concept</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Qu&apos;est-ce qu&apos;un compte optimisé IA ?
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-6">
                Un <strong className="text-white">compte optimisé IA</strong> est un compte bookmaker
                configuré pour exploiter directement les analyses de l&apos;algorithme AlgoPronos.
              </p>
              <p className="text-text-secondary leading-relaxed mb-8">
                L&apos;utilisateur n&apos;a plus besoin de chercher des pronostics ou de comparer
                des cotes manuellement. Le système fait le travail : il analyse, sélectionne
                et explique chaque pari.
              </p>
              <div className="space-y-3">
                {[
                  'Analyse statistique des équipes en temps réel',
                  'Comparaison des cotes entre bookmakers',
                  'Identification des value bets',
                  'Génération de combinés optimisés selon le risque',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-text-secondary">{item}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Right — Visual card */}
            <ScrollReveal direction="right" delay={0.1}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl opacity-50" />
                <div className="relative bg-surface border border-primary/25 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary to-secondary px-6 py-5 flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Compte optimisé IA</div>
                      <div className="text-xs text-white/70">AlgoPronos activé</div>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-white font-medium">Actif</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 divide-x divide-surface-light border-b border-surface-light">
                    {[
                      { label: 'Tickets générés', value: '47', color: 'text-white' },
                      { label: 'Taux de réussite', value: '78%', color: 'text-primary' },
                      { label: 'Cote moy.', value: 'x5.2', color: 'text-secondary' },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 text-center">
                        <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pick example */}
                  <div className="p-5 space-y-3">
                    <div className="text-xs text-text-muted uppercase font-medium tracking-wider">Dernier ticket généré</div>
                    {[
                      { match: 'Arsenal – Chelsea', pick: 'Arsenal Victoire', odds: '2.15', conf: 74 },
                      { match: 'Real Madrid – Barça', pick: '+2.5 buts', odds: '1.88', conf: 81 },
                    ].map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-surface-light rounded-xl px-4 py-3">
                        <div>
                          <div className="text-xs text-text-muted">{p.match}</div>
                          <div className="text-sm font-semibold text-white">{p.pick}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{p.odds}</div>
                          <div className="text-xs text-secondary">{p.conf}% conf.</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-5">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-center">
                      <span className="text-primary font-bold">Cote totale : x4.04</span>
                      <span className="text-text-muted text-sm"> · Confiance IA : 77%</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">3 étapes</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Comment activer votre compte optimisé ?
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                De la création du compte à votre premier ticket IA en quelques minutes.
              </p>
            </div>
          </ScrollReveal>

          {/* Steps */}
          <div className="space-y-8 mb-16">
            {STEPS.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.12}>
                <div className="flex gap-6 items-start bg-surface border border-surface-light rounded-2xl p-6 hover:border-primary/30 transition-colors">
                  {/* Number */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg`}>
                    {step.num}
                  </div>
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-text-secondary leading-relaxed mb-3">{step.description}</p>
                    <p className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2 inline-block">
                      {step.note}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Inline bookmaker selector for step 1 */}
          <ScrollReveal delay={0.2}>
            <div className="bg-surface border border-primary/20 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-xl font-bold text-white">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Choisissez votre bookmaker</h3>
                  <p className="text-sm text-text-muted">Sélectionnez-en un pour afficher votre lien d&apos;activation</p>
                </div>
              </div>
              <BookmakerSelector />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── AVANTAGES ───────────────────────────────────────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Pourquoi AlgoPronos ?</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                4 avantages d&apos;un compte optimisé IA
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Plus qu&apos;un simple générateur de pronostics — un outil d&apos;analyse complet.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-6">
            {ADVANTAGES.map((adv, i) => (
              <ScrollReveal key={i} delay={(i % 2) * 0.1}>
                <div className="group bg-background border border-surface-light rounded-2xl p-7 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                  <div className={`w-13 h-13 w-12 h-12 ${adv.bg} rounded-xl flex items-center justify-center ${adv.color} mb-5 transition-all duration-300 group-hover:text-white`}>
                    <adv.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{adv.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{adv.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VÉRIFICATEUR ────────────────────────────────────────────────────── */}
      <section id="verificateur" className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
                </span>
                <span className="text-red-400 text-sm font-semibold">Important · À vérifier avant de jouer</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Votre compte est-il{' '}
                <span className="bg-gradient-to-r from-primary to-[#00D4FF] bg-clip-text text-transparent">
                  Optimisé IA ?
                </span>
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto">
                Les comptes non créés via AlgoPronos ne bénéficient pas de la configuration
                nécessaire. Vérifiez en quelques secondes.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <VerificateurWidget />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── TICKET DU JOUR LIVE ─────────────────────────────────────────────── */}
      <LiveTicketSection />

      {/* ─── BOOKMAKERS COMPATIBLES ──────────────────────────────────────────── */}
      <section id="bookmakers" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4">Bookmakers compatibles</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ouvrez un compte optimisé
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Choisissez votre bookmaker parmi nos partenaires et activez votre accès AlgoPronos instantanément.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <BookmakerAffiliateButtons />
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-center text-xs text-text-muted mt-10 max-w-xl mx-auto">
              Jouez de manière responsable. Les paris sportifs comportent des risques.
              AlgoPronos AI n&apos;est pas responsable des pertes liées aux paris. Réservé aux personnes majeures.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4">
          <ScrollReveal>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { value: '+15 000', label: 'Utilisateurs actifs', icon: Users },
                { value: '< 15s', label: 'Pour générer un ticket', icon: Zap },
                { value: '100%', label: 'Gratuit, sans abonnement', icon: CheckCircle2 },
              ].map((s, i) => (
                <div key={i} className="bg-background border border-surface-light rounded-2xl p-6">
                  <s.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                  <div className="text-text-muted text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <ScrollReveal>
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              Prêt à générer votre premier ticket IA ?
            </h2>
            <p className="text-text-secondary text-lg mb-10 max-w-2xl mx-auto">
              Compte créé ? Accédez immédiatement au générateur. Analyse statistique,
              sélection optimisée et raisonnement complet — gratuitement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="gradient" asChild>
                <Link href="/dashboard/generate">
                  <Rocket className="mr-2 h-5 w-5" />
                  Générer mon premier ticket IA
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <a href="#bookmakers">
                  Créer mon compte bookmaker
                  <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}

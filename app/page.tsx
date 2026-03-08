import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { BookmakerMarquee } from '@/components/marketing/BookmakerMarquee';
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
  Star,
  Brain,
  FileText,
  Globe,
  Sparkles,
  BarChart3,
  MessageCircle,
  CheckCircle2,
  Gift,
  Share2,
  Trophy,
  Zap,
} from 'lucide-react';
import { HeroTicketPreview } from '@/components/landing/HeroTicketPreview';
import { StatsBar } from '@/components/landing/StatsBar';
import { LiveTicketSection } from '@/components/landing/LiveTicketSection';
import { ShareShowcase } from '@/components/landing/ShareShowcase';
import { ClassementPreview } from '@/components/landing/ClassementPreview';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

// FAQ
const faqItems = [
  {
    question: 'Comment fonctionne AlgoPronos AI ?',
    answer:
      "Notre plateforme utilise une IA avancée pour analyser des centaines de matchs en temps réel. L'IA prend en compte les statistiques, la forme des équipes, les historiques de confrontation et bien plus pour générer des combinés optimisés.",
  },
  {
    question: 'AlgoPronos AI est vraiment 100% gratuit ?',
    answer:
      "Oui, absolument ! AlgoPronos AI est entièrement gratuit. La seule condition est de créer un compte 1xBet via notre lien partenaire. Vous bénéficiez alors d'analyses IA sans jamais payer.",
  },
  {
    question: 'Combien de coupons puis-je générer par semaine ?',
    answer:
      "Chaque utilisateur vérifié bénéficie d'analyses IA illimitées. Les visiteurs et utilisateurs inscrits disposent d'un quota hebdomadaire qui s'élargit à chaque palier.",
  },
  {
    question: 'Combien de temps prend la vérification ?',
    answer:
      'La vérification est généralement effectuée sous 24 heures maximum. Une fois approuvée, votre compte est activé et vous pouvez commencer à générer des pronostics immédiatement.',
  },
  {
    question: 'Puis-je utiliser AlgoPronos AI sur mobile ?',
    answer:
      "Oui, notre plateforme est entièrement responsive et fonctionne parfaitement sur tous les appareils : smartphone, tablette et ordinateur.",
  },
  {
    question: 'Quel est le taux de réussite des combinés ?',
    answer:
      'Notre taux de réussite moyen est de 78.5% sur les 6 derniers mois. Nous publions régulièrement nos statistiques en toute transparence. Notez que les paris sportifs comportent toujours des risques.',
  },
];

const features = [
  { icon: Brain, title: 'IA Ultra-Précise', desc: 'Analyse en temps réel des statistiques, forme et historiques de chaque équipe' },
  { icon: FileText, title: 'Analyses Approfondies', desc: 'Statistiques, forme, historiques, tactiques — chaque détail compte' },
  { icon: Globe, title: 'Multi-Championnats', desc: 'CAN, Premier League, La Liga, Ligue 1, Bundesliga, Serie A et plus' },
  { icon: Share2, title: 'Partage Viral', desc: "Partage ton ticket en image sur WhatsApp, Telegram, Facebook d'un seul clic" },
  { icon: Trophy, title: 'Classement IA', desc: 'Consulte les meilleurs tickets du jour et rejoue-les en un clic' },
  { icon: Sparkles, title: '100% Gratuit', desc: 'Analyses IA illimitées avec ton compte 1xBet partenaire' },
  { icon: BarChart3, title: 'Historique Transparent', desc: 'Consultez tous nos résultats passés — on cache rien !' },
  { icon: Zap, title: 'Ticket du Jour', desc: "Notre IA génère automatiquement le meilleur ticket chaque matin" },
  { icon: MessageCircle, title: 'Communauté Active', desc: 'Échangez avec 15k+ parieurs passionnés' },
];

const testimonials = [
  { name: 'Koffi M.', location: 'Cotonou, Bénin', rating: 5, text: "Depuis que j'utilise AlgoPronos AI, mes gains ont triplé. Les analyses sont d'un niveau professionnel !" },
  { name: 'Aminata D.', location: "Abidjan, Côte d'Ivoire", rating: 5, text: 'Gratuit et efficace ! Les combinés sont vraiment bien étudiés. Je partage mes tickets tous les jours.' },
  { name: 'Moussa S.', location: 'Dakar, Sénégal', rating: 5, text: "L'IA est impressionnante. J'ai gagné 6 fois sur mes 8 derniers combinés. Incroyable !" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-20 left-10 w-80 h-80 bg-primary rounded-full mix-blend-multiply filter blur-[120px] animate-blob" />
          <div className="absolute top-40 right-10 w-80 h-80 bg-secondary rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-accent rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — text */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
                <Gift className="h-4 w-4 text-success" />
                <span className="text-success text-sm font-medium">
                  100% Gratuit — Analyses IA illimitées
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-slide-up">
                Générez des{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
                  Combinés Gagnants
                </span>
                <br />
                avec l&apos;IA
              </h1>

              <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-xl animate-slide-up">
                Notre IA analyse des centaines de matchs en temps réel et génère ton ticket parfait
                en moins de 15 secondes. Partage-le, rejoue-le, gagne.
              </p>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4 mb-10 text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>100% Sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent fill-accent" />
                  <span>4.9/5 sur 2,340 avis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>78.5% de réussite</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" variant="gradient" asChild>
                  <Link href="/onboarding">
                    <Rocket className="mr-2 h-5 w-5" />
                    Activer Mon Compte Gratuit
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/api/try-free">
                    Essayer sans compte
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right — live ticket preview */}
            <div className="hidden lg:flex justify-center">
              <HeroTicketPreview />
            </div>
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-1 text-text-muted">
            <div className="w-6 h-10 border-2 border-text-muted rounded-full flex items-start justify-center p-1">
              <div className="w-1 h-3 bg-text-muted rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─────────────────────────────────────────────── */}
      <StatsBar />

      {/* ─── TICKET DU JOUR (live) ─────────────────────────────────── */}
      <LiveTicketSection />

      {/* ─── HOW IT WORKS ──────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Simple et rapide</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Comment ça marche ?</h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">En 3 étapes, tu accèdes à des pronostics IA professionnels</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-30" />

            {[
              { num: '1', icon: Gift, title: 'Créez un compte 1xBet', desc: "Utilisez notre lien partenaire pour bénéficier des bonus et activer AlgoPronos AI gratuitement", color: 'from-primary to-primary/50' },
              { num: '2', icon: Brain, title: "Soumettez votre ID", desc: "Entrez l'ID ou email de votre compte 1xBet pour vérification — sous 24h maximum", color: 'from-secondary to-secondary/50' },
              { num: '3', icon: Rocket, title: 'Générez & Gagnez', desc: "Profitez d'analyses IA illimitées, partagez vos tickets et grimpez dans le classement", color: 'from-accent to-accent/50' },
            ].map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.15} direction="up">
                <div className="relative text-center group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {step.num}
                  </div>
                  <div className="w-12 h-12 bg-surface-light rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-text-secondary">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Fonctionnalités</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Pourquoi AlgoPronos AI ?</h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                Une plateforme complète : IA, partage viral, classement, ticket du jour — tout est là.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <ScrollReveal key={i} delay={(i % 3) * 0.1} direction="up">
                <div className="group bg-surface rounded-2xl p-6 border border-surface-light hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SHARE SHOWCASE ────────────────────────────────────────── */}
      <ShareShowcase />

      {/* ─── CLASSEMENT PREVIEW ────────────────────────────────────── */}
      <ClassementPreview />

      {/* ─── PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="success" className="mb-4">100% GRATUIT</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Accès Complet Sans Payer</h2>
              <p className="text-text-secondary text-lg">Créez simplement un compte 1xBet via notre lien partenaire</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="max-w-2xl mx-auto">
              <div className="relative rounded-3xl p-8 bg-gradient-to-b from-primary/20 to-surface border-2 border-primary shadow-2xl shadow-primary/20">
                <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1">
                  GRATUIT À VIE
                </Badge>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">AlgoPronos AI</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-white">0 FCFA</span>
                  </div>
                  <p className="text-text-muted mt-1">Analyses IA illimitées</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Analyses IA illimitées',
                    'Ticket du Jour automatique',
                    'Partage viral (WhatsApp, Telegram, Facebook)',
                    'Classement & historique transparent',
                    'Tous les championnats (PL, Liga, CL, CAN...)',
                    "Bonus 1xBet jusqu'à 250 000 FCFA",
                    'Accès à vie',
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" variant="gradient" className="w-full" asChild>
                  <Link href="/onboarding">
                    <Gift className="mr-2 h-5 w-5" />
                    Activer Mon Compte Gratuit
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Témoignages</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ils nous font confiance</h2>
              <p className="text-text-secondary text-lg">Rejoignez des milliers d&apos;utilisateurs satisfaits</p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <ScrollReveal key={i} delay={i * 0.12}>
                <div className="bg-surface rounded-2xl p-6 border border-surface-light hover:border-primary/30 transition-colors duration-300 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-text-secondary mb-6 leading-relaxed">&quot;{t.text}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-text-muted">{t.location}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOOKMAKERS MARQUEE ────────────────────────────────────── */}
      <BookmakerMarquee />

      {/* ─── FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-surface">
        <div className="max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Questions Fréquentes</h2>
            </div>
          </ScrollReveal>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background rounded-xl px-6 border border-surface-light hover:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left text-white">{item.question}</AccordionTrigger>
                <AccordionContent className="text-text-secondary">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <ScrollReveal>
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
              Prêt à générer tes combinés gagnants ?
            </h2>
            <p className="text-text-secondary text-lg mb-10 max-w-2xl mx-auto">
              Rejoins plus de 15 000 parieurs qui font confiance à AlgoPronos AI.
              100% gratuit, ticket du jour automatique, partage viral.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="gradient" asChild>
                <Link href="/onboarding">
                  <Rocket className="mr-2 h-5 w-5" />
                  Activer Mon Compte Gratuit
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/api/try-free">
                  Essayer sans compte
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

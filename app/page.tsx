import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { PromoWidget1xBet } from '@/components/marketing/PromoWidget1xBet';
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
  TrendingUp,
  Users,
  Zap,
  Shield,
  Clock,
  Star,
  Brain,
  FileText,
  Globe,
  Sparkles,
  BarChart3,
  MessageCircle,
  CheckCircle2,
  Gift,
} from 'lucide-react';

// Stats Component
function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-surface/50 backdrop-blur-sm rounded-xl px-5 py-3 border border-surface-light">
      <div className="text-primary">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-text-muted">{label}</div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-surface rounded-2xl p-6 border border-surface-light hover:border-primary/50 transition-all duration-300 card-hover">
      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
}

// Step Card Component
function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6 shadow-lg shadow-primary/25">
        {number}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({
  name,
  location,
  rating,
  text,
}: {
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface-light">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <p className="text-text-secondary mb-6 leading-relaxed">&quot;{text}&quot;</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
          {name[0]}
        </div>
        <div>
          <div className="font-semibold text-white">{name}</div>
          <div className="text-sm text-text-muted">{location}</div>
        </div>
      </div>
    </div>
  );
}

// FAQ Data
const faqItems = [
  {
    question: 'Comment fonctionne AlgoPronos AI ?',
    answer:
      "Notre plateforme utilise Claude, l'une des IA les plus avancées au monde, pour analyser des centaines de matchs en temps réel. L'IA prend en compte les statistiques, la forme des équipes, les historiques de confrontation et bien plus pour générer des combinés optimisés.",
  },
  {
    question: 'AlgoPronos AI est vraiment 100% gratuit ?',
    answer:
      'Oui, absolument ! AlgoPronos AI est entièrement gratuit. La seule condition est de créer un compte 1xBet via notre lien partenaire. Vous bénéficiez alors d\'analyses IA sans jamais payer.',
  },
  {
    question: 'Combien de coupons puis-je générer par semaine ?',
    answer:
      'Chaque utilisateur vérifié bénéficie d\'analyses IA illimitées. Les visiteurs et utilisateurs inscrits disposent d\'un quota hebdomadaire qui s\'élargit à chaque palier.',
  },
  {
    question: 'Combien de temps prend la vérification ?',
    answer:
      'La vérification est généralement effectuée sous 24 heures maximum. Une fois approuvée, votre compte est activé et vous pouvez commencer à générer des pronostics immédiatement.',
  },
  {
    question: 'Puis-je utiliser AlgoPronos AI sur mobile ?',
    answer:
      "Oui, notre plateforme est entièrement responsive et fonctionne parfaitement sur tous les appareils : smartphone, tablette et ordinateur. Vous pouvez générer vos combinés où que vous soyez.",
  },
  {
    question: 'Quel est le taux de réussite des combinés ?',
    answer:
      'Notre taux de réussite moyen est de 78.5% sur les 6 derniers mois. Nous publions régulièrement nos statistiques en toute transparence. Notez que les paris sportifs comportent toujours des risques.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-4 py-2 mb-8">
            <Gift className="h-4 w-4 text-success" />
            <span className="text-success text-sm font-medium">
              100% Gratuit - Analyses IA illimitées
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Générez des Combinés Gagnants
            <br />
            avec{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              l&apos;IA la Plus Avancée
            </span>{' '}
            d&apos;Afrique
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto">
            Analyses professionnelles automatisées. 100% gratuit avec votre compte 1xBet.
            Pronostics IA personnalisés selon votre profil.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-12">
            <Stat
              icon={<TrendingUp className="h-6 w-6" />}
              value="78.5%"
              label="Taux de réussite"
            />
            <Stat
              icon={<Users className="h-6 w-6" />}
              value="15,234"
              label="Utilisateurs actifs"
            />
            <Stat icon={<Zap className="h-6 w-6" />} value="&lt;15s" label="Génération IA" />
          </div>

          {/* CTA */}
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

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>100% Sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Vérification sous 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span>4.9/5 sur 2,340 avis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Widget Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4">
          <PromoWidget1xBet />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Fonctionnalités
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pourquoi AlgoPronos AI ?
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Une plateforme conçue pour maximiser vos chances de gains avec l&apos;IA
              la plus avancée du marché.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-8 w-8" />}
              title="IA Ultra-Précise"
              description="Propulsé par Claude, le modèle le plus avancé pour l'analyse sportive"
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="Analyses Approfondies"
              description="Statistiques, forme, historiques, tactiques - chaque détail compte"
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Multi-Championnats"
              description="CAN, Premier League, La Liga, Ligue 1, Bundesliga, Serie A et plus"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="100% Gratuit"
              description="2 coupons IA par jour, sans jamais payer"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Historique Transparent"
              description="Consultez tous nos résultats passés - on cache rien !"
            />
            <FeatureCard
              icon={<MessageCircle className="h-8 w-8" />}
              title="Communauté Active"
              description="Échangez avec 15k+ parieurs passionnés"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Simple et rapide
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Activez votre compte en 3 étapes simples
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="1"
              title="Créez un compte 1xBet"
              description="Utilisez notre lien partenaire pour bénéficier des bonus et activer AlgoPronos AI"
            />
            <StepCard
              number="2"
              title="Soumettez votre ID"
              description="Entrez l'ID ou email de votre compte 1xBet pour vérification"
            />
            <StepCard
              number="3"
              title="Générez vos coupons"
              description="Une fois vérifié, profitez de 2 coupons IA gratuits par jour"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="success" className="mb-4">
              100% GRATUIT
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Accès Complet Sans Payer
            </h2>
            <p className="text-text-secondary text-lg">
              Créez simplement un compte 1xBet via notre lien partenaire
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative rounded-3xl p-8 bg-gradient-to-b from-primary/20 to-surface border-2 border-primary shadow-2xl shadow-primary/20">
              <Badge
                variant="success"
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1"
              >
                GRATUIT À VIE
              </Badge>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">AlgoPronos AI</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-white">0 FCFA</span>
                </div>
                <p className="text-text-muted mt-1">Analyses IA illimitées</p>
                <p className="text-text-secondary mt-4">
                  Activez avec un compte 1xBet via notre lien partenaire
                </p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Analyses IA illimitées',
                  'Analyses complètes par match',
                  'Tous les championnats',
                  'Toutes les cotes (1.5 à 100+)',
                  'Historique de vos pronostics',
                  'Bonus 1xBet jusqu\'à 250 000 FCFA',
                  'Support par email',
                  'Accès à vie',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant="gradient"
                className="w-full"
                asChild
              >
                <Link href="/onboarding">
                  <Gift className="mr-2 h-5 w-5" />
                  Activer Mon Compte Gratuit
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Témoignages
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-text-secondary text-lg">
              Rejoignez des milliers d&apos;utilisateurs satisfaits
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Koffi M."
              location="Cotonou, Bénin"
              rating={5}
              text="Depuis que j'utilise AlgoPronos AI, mes gains ont triplé. Les analyses sont d'un niveau professionnel !"
            />
            <TestimonialCard
              name="Aminata D."
              location="Abidjan, Côte d'Ivoire"
              rating={5}
              text="Gratuit et efficace ! Les 2 coupons par jour me suffisent largement. Les combinés sont vraiment bien étudiés."
            />
            <TestimonialCard
              name="Moussa S."
              location="Dakar, Sénégal"
              rating={5}
              text="L'IA est impressionnante. J'ai gagné 6 fois sur mes 8 derniers combinés. Incroyable !"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Questions Fréquentes
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-surface rounded-xl px-6 border border-surface-light"
              >
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-surface to-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à générer vos combinés gagnants ?
          </h2>
          <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez plus de 15,000 utilisateurs qui font confiance à AlgoPronos AI
            pour leurs paris sportifs. 100% gratuit, analyses IA personnalisées.
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
        </div>
      </section>

      <Footer />
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/app/code-promo-1xbet/CopyButton';
import {
  CheckCircle2, ArrowRight, Gift, ChevronRight,
  Zap, Clock, Smartphone, AlertTriangle, Banknote,
} from 'lucide-react';

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';
const CURRENT_YEAR = new Date().getFullYear();

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `Retrait 1xBet Orange Money & Wave ${CURRENT_YEAR} : Guide complet en 2 minutes — AlgoPronos`,
  description: `Comment retirer ses gains 1xBet par Orange Money ou Wave en Afrique de l'Ouest en ${CURRENT_YEAR} ? Guide complet étape par étape : vérification, montant minimum, délai. Méthode optimisée AlgoPronos.`,
  keywords: [
    `retrait 1xbet orange money ${CURRENT_YEAR}`,
    'comment retirer argent 1xbet',
    'retrait 1xbet wave sénégal',
    'retrait 1xbet mobile money afrique',
    'retrait 1xbet mtn momo',
    'délai retrait 1xbet',
    'retrait 1xbet bénin orange money',
    'retrait 1xbet côte d\'ivoire mtn',
    'comment encaisser gains 1xbet',
    'retrait 1xbet minimum',
    '1xbet paiement orange money afrique',
  ].join(', '),
  alternates: { canonical: 'https://algopronos.com/retrait-1xbet-orange-money' },
  openGraph: {
    title: `Retrait 1xBet Orange Money & Wave ${CURRENT_YEAR} — Guide AlgoPronos`,
    description: `Retirez vos gains 1xBet via Orange Money, Wave, MTN MoMo en 2 minutes. Guide complet pour l'Afrique de l'Ouest.`,
    url: 'https://algopronos.com/retrait-1xbet-orange-money',
    siteName: 'AlgoPronos AI',
    type: 'article',
    locale: 'fr_FR',
  },
};

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: `Comment retirer ses gains 1xBet par Orange Money ou Wave en ${CURRENT_YEAR}`,
  description: `Guide étape par étape pour effectuer un retrait 1xBet via Orange Money, Wave ou MTN MoMo en Afrique de l'Ouest.`,
  totalTime: 'PT5M',
  tool: [
    { '@type': 'HowToTool', name: 'Application 1xBet ou site web' },
    { '@type': 'HowToTool', name: 'Numéro Mobile Money (Orange Money, Wave, MTN MoMo)' },
  ],
  step: [
    {
      '@type': 'HowToStep', position: 1,
      name: 'Vérifiez votre solde et l\'éligibilité au retrait',
      text: 'Connectez-vous sur 1xBet. Assurez-vous que votre solde dépasse le minimum de retrait (en général 1 USD ou équivalent en FCFA). Vérifiez que votre compte est bien vérifié.',
      url: 'https://algopronos.com/retrait-1xbet-orange-money',
    },
    {
      '@type': 'HowToStep', position: 2,
      name: 'Accédez à la section "Retrait" dans votre compte 1xBet',
      text: 'Sur l\'application ou le site 1xBet, cliquez sur votre profil → "Caisse" ou "Paiements" → "Retrait". Choisissez le mode de paiement Mobile Money.',
      url: 'https://algopronos.com/retrait-1xbet-orange-money',
    },
    {
      '@type': 'HowToStep', position: 3,
      name: 'Sélectionnez Orange Money, Wave ou MTN MoMo',
      text: 'Dans la liste des méthodes de retrait, choisissez votre opérateur : Orange Money, Wave (Sénégal/CI), MTN MoMo (Bénin/Cameroun), T-Money (Togo) ou autre opérateur local disponible dans votre pays.',
      url: 'https://algopronos.com/retrait-1xbet-orange-money',
    },
    {
      '@type': 'HowToStep', position: 4,
      name: 'Entrez votre numéro Mobile Money et le montant',
      text: 'Saisissez votre numéro de téléphone Mobile Money (doit être identique au nom du compte 1xBet) et le montant souhaité. Vérifiez deux fois le numéro avant de valider.',
      url: 'https://algopronos.com/retrait-1xbet-orange-money',
    },
    {
      '@type': 'HowToStep', position: 5,
      name: 'Confirmez et attendez la notification',
      text: 'Validez la demande. Un SMS ou une notification de confirmation est envoyé sur votre téléphone. Le délai de traitement varie entre quelques minutes et 24h selon l\'opérateur et la charge du réseau.',
      url: 'https://algopronos.com/retrait-1xbet-orange-money',
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quel est le montant minimum de retrait sur 1xBet par Orange Money ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Le montant minimum de retrait sur 1xBet via Orange Money est généralement de 1 USD (environ 600 FCFA selon le taux de change en ${CURRENT_YEAR}). Ce montant peut varier selon la méthode choisie (Wave, MTN MoMo, T-Money) et le pays. Vérifiez toujours la section "Retrait" de votre compte 1xBet pour les limites actualisées.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Combien de temps prend un retrait 1xBet via Mobile Money ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le délai de retrait 1xBet via Mobile Money (Orange Money, Wave, MTN MoMo) est en général de quelques minutes à 24 heures. En pratique, la majorité des retraits sont traités en moins de 2 heures. Les délais peuvent être plus longs lors des périodes de forte charge ou lors de vérifications de compte supplémentaires.',
      },
    },
    {
      '@type': 'Question',
      name: 'Pourquoi mon retrait 1xBet est-il bloqué ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Un retrait 1xBet bloqué peut avoir plusieurs causes : (1) compte non vérifié — envoyez vos documents d'identité, (2) numéro Mobile Money différent du nom sur le compte 1xBet, (3) bonus de bienvenue non converti — misez d'abord le montant du bonus, (4) limites de retrait journalières atteintes. Contactez le support 1xBet via le chat en direct pour débloquer votre demande.",
      },
    },
    {
      '@type': 'Question',
      name: 'Orange Money est-il disponible pour les retraits 1xBet au Sénégal, Bénin et Côte d\'Ivoire ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Oui. Orange Money est disponible pour les retraits 1xBet au Sénégal, en Côte d'Ivoire, au Bénin, au Mali, au Burkina Faso et dans la plupart des pays d'Afrique de l'Ouest. Au Sénégal, Wave est aussi disponible et souvent plus rapide. En Côte d'Ivoire, MTN MoMo et Moov Money sont également pris en charge.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Peut-on retirer ses gains 1xBet sans avoir parié le bonus ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Non. Le bonus de bienvenue 1xBet doit être misé un certain nombre de fois (conditions de rollover) avant de pouvoir être retiré. En revanche, votre dépôt initial (hors bonus) peut être retiré à tout moment. Lisez les conditions du bonus dans la section promotions de votre compte 1xBet.',
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
    { '@type': 'ListItem', position: 2, name: 'Guide retrait 1xBet Orange Money', item: 'https://algopronos.com/retrait-1xbet-orange-money' },
  ],
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: `Comment retirer ses gains 1xBet par Orange Money ou Wave en ${CURRENT_YEAR}`,
  author: { '@type': 'Organization', name: 'AlgoPronos AI', url: 'https://algopronos.com' },
  publisher: {
    '@type': 'Organization',
    name: 'AlgoPronos AI',
    logo: {
      '@type': 'ImageObject',
      url: 'https://algopronos.com/algopronos-logo.png',
      width: '512',
      height: '512',
      caption: 'AlgoPronos AI Logo',
    },
  },
  datePublished: '2025-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://algopronos.com/retrait-1xbet-orange-money' },
};

// ─── Tableau opérateurs par pays ──────────────────────────────────────────────

const OPERATORS = [
  { pays: 'Sénégal', flag: '🇸🇳', methodes: ['Wave', 'Orange Money', 'Free Money'], delai: '1–30 min', note: 'Wave est généralement le plus rapide au Sénégal' },
  { pays: 'Côte d\'Ivoire', flag: '🇨🇮', methodes: ['Orange Money CI', 'MTN MoMo CI', 'Moov Money CI'], delai: '5–60 min', note: 'Orange Money CI traite la plupart des demandes en moins de 30 min' },
  { pays: 'Bénin', flag: '🇧🇯', methodes: ['MTN MoMo', 'Moov Money', 'Celtiis Cash'], delai: '5–60 min', note: 'MTN MoMo Bénin disponible 24h/24' },
  { pays: 'Mali', flag: '🇲🇱', methodes: ['Orange Money Mali', 'Malitel Money'], delai: '10–120 min', note: 'Vérifiez que le nom du compte correspond à votre ID 1xBet' },
  { pays: 'Togo', flag: '🇹🇬', methodes: ['T-Money', 'Flooz (Moov)', 'Orange Money TG'], delai: '5–60 min', note: 'T-Money est le plus répandu au Togo' },
  { pays: 'Burkina Faso', flag: '🇧🇫', methodes: ['Orange Money BF', 'Moov Money BF', 'CORIS Money'], delai: '10–120 min', note: 'CORIS Money disponible dans certaines zones' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RetraitOrangeMoneyPage() {
  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <Header />

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-14 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <div className="absolute top-10 right-1/4 w-80 h-80 bg-secondary rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10">
          <nav className="flex items-center gap-2 text-xs text-text-muted mb-8">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Retrait 1xBet Orange Money</span>
          </nav>

          <Badge variant="outline" className="mb-5 text-primary border-primary/30">
            💳 Guide complet {CURRENT_YEAR} — Orange Money · Wave · MTN MoMo
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
            Retirer ses gains 1xBet par Orange Money ou Wave en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              2 minutes
            </span>{' '}— Guide {CURRENT_YEAR}
          </h1>

          <p className="text-lg text-text-secondary mb-4 leading-relaxed">
            Vous avez gagné sur 1xBet et vous voulez encaisser via votre Mobile Money local ?
            Ce guide explique la procédure exacte, les délais réels et les erreurs à éviter
            pour retirer rapidement au Sénégal, Bénin, Côte d&apos;Ivoire et dans toute l&apos;Afrique de l&apos;Ouest.
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> Délai : 1 min – 24h selon opérateur</span>
            <span className="flex items-center gap-1.5"><Banknote className="h-4 w-4 text-primary" /> Minimum : ~600 FCFA</span>
            <span className="flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-primary" /> Orange Money · Wave · MTN MoMo · T-Money</span>
          </div>
        </div>
      </section>

      {/* ── ÉTAPES ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-3 text-center">
            Comment retirer sur 1xBet via Orange Money ou Wave
          </h2>
          <p className="text-text-secondary text-center mb-10">5 étapes · 2 à 5 minutes</p>
          <ol className="space-y-4">
            {howToJsonLd.step.map((step, i) => (
              <li key={i} className="flex gap-4 bg-background border border-surface-light rounded-2xl p-5 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/50 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {step.position}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{step.name}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 bg-warning/5 border border-warning/20 rounded-2xl p-5 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning mb-1">Point critique : vérification d&apos;identité</p>
              <p className="text-sm text-text-secondary">
                1xBet peut demander une vérification d&apos;identité (KYC) avant votre premier retrait.
                Préparez une copie de votre CNI ou passeport. Sans KYC validé, les retraits sont bloqués.
                Anticipez en vérifiant votre compte dès la création.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABLEAU OPÉRATEURS ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-3 text-center">
            Méthodes de retrait disponibles par pays
          </h2>
          <p className="text-text-secondary text-center mb-10">
            Opérateurs Mobile Money acceptés sur 1xBet en Afrique de l&apos;Ouest — mis à jour {CURRENT_YEAR}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {OPERATORS.map((op, i) => (
              <div key={i} className="bg-surface border border-surface-light rounded-2xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{op.flag}</span>
                  <h3 className="font-bold text-white">{op.pays}</h3>
                  <span className="ml-auto text-xs text-text-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {op.delai}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {op.methodes.map((m) => (
                    <span key={m} className="text-xs bg-background border border-surface-light rounded-md px-2 py-1 text-text-secondary">
                      💳 {m}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-text-muted">{op.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPTE OPTIMISÉ CTA ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Pas encore de compte 1xBet ?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Commencez avec l&apos;IA
            </span>
          </h2>
          <p className="text-text-secondary mb-6">
            Créez votre compte 1xBet avec le code <strong className="text-primary">{PROMO_CODE}</strong> pour activer votre
            Compte Optimisé IA AlgoPronos — l&apos;accès au générateur de pronostics IA. 100% gratuit.
          </p>
          <div className="max-w-xs mx-auto mb-6">
            <CopyButton code={PROMO_CODE} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/redirect?url=${encodeURIComponent(AFFILIATE_URL)}&bookmaker=1xBet`}>
              <Button variant="gradient" size="lg">
                <Gift className="mr-2 h-5 w-5" />
                Créer mon compte 1xBet
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/verificateur-compte">
              <Button variant="outline" size="lg">
                Vérifier mon compte existant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-text-muted mt-6">
            Jouez responsable · 18+ · AlgoPronos ne garantit pas les gains · Paris à risque
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Questions fréquentes — Retrait 1xBet Mobile Money
          </h2>
          <div className="space-y-4">
            {faqJsonLd.mainEntity.map((item, i) => (
              <details
                key={i}
                className="group bg-surface border border-surface-light rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="font-semibold text-white pr-4 text-left">{item.name}</h3>
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-text-secondary leading-relaxed text-sm">{item.acceptedAnswer.text}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIENS INTERNES ── */}
      <section className="py-10 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-white mb-4">Voir aussi</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: '/code-promo-1xbet', label: 'Code Promo 1xBet' },
              { href: '/ancien-code-promo-1xbet', label: 'Ancien code expiré ?' },
              { href: '/compte-optimise-ia', label: 'Compte Optimisé IA' },
              { href: '/1xbet/senegal', label: '1xBet Sénégal' },
              { href: '/1xbet/benin', label: '1xBet Bénin' },
              { href: '/1xbet/cote-divoire', label: '1xBet Côte d\'Ivoire' },
              { href: '/pronostics', label: 'Pronostics IA du jour' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 bg-background border border-surface-light hover:border-primary/40 rounded-xl px-4 py-2 text-sm text-text-secondary hover:text-white transition-all"
              >
                {link.label} <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

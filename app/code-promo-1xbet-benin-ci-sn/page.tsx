import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/app/code-promo-1xbet/CopyButton';
import {
  CheckCircle2, ArrowRight, Gift, ChevronRight, Brain, Shield, Zap,
} from 'lucide-react';

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';
const CURRENT_YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Code Promo 1xBet Bénin, Côte d'Ivoire & Sénégal ${CURRENT_YEAR} : ${PROMO_CODE} — Compte Optimisé IA`,
  description: `Code promo 1xBet officiel AlgoPronos pour le Bénin, la Côte d'Ivoire et le Sénégal en ${CURRENT_YEAR}. Code ${PROMO_CODE} : bonus de bienvenue + Compte Optimisé IA gratuit. MTN MoMo, Orange Money, Wave acceptés.`,
  keywords: [
    `code promo 1xbet bénin ${CURRENT_YEAR}`,
    `code promo 1xbet côte d'ivoire ${CURRENT_YEAR}`,
    `code promo 1xbet sénégal ${CURRENT_YEAR}`,
    'code promo 1xbet afrique de l\'ouest',
    'code 1xbet algopronos bénin',
    'code 1xbet algopronos ci',
    'bonus 1xbet bénin côte d\'ivoire sénégal',
    'inscription 1xbet afrique de l\'ouest',
    '1xbet orange money bénin',
    '1xbet wave sénégal',
    '1xbet mtn momo côte d\'ivoire',
    'compte optimisé ia 1xbet afrique',
  ].join(', '),
  alternates: { canonical: `https://algopronos.com/code-promo-1xbet-benin-ci-sn` },
  openGraph: {
    title: `Code Promo 1xBet Bénin, CI & Sénégal ${CURRENT_YEAR} — ${PROMO_CODE} | AlgoPronos`,
    description: `Le code ${PROMO_CODE} fonctionne au Bénin 🇧🇯, en Côte d'Ivoire 🇨🇮 et au Sénégal 🇸🇳. Bonus + Compte Optimisé IA gratuit.`,
    url: 'https://algopronos.com/code-promo-1xbet-benin-ci-sn',
    siteName: 'AlgoPronos AI',
    type: 'website',
    locale: 'fr_FR',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: `Quel est le meilleur code promo 1xBet en Afrique de l'Ouest en ${CURRENT_YEAR} ?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Le meilleur code promo 1xBet pour l'Afrique de l'Ouest en ${CURRENT_YEAR} est ${PROMO_CODE} (AlgoPronos). Il est valable au Bénin, en Côte d'Ivoire, au Sénégal, au Mali, au Togo, au Burkina Faso et dans toute la région. C'est le seul code qui active le Compte Optimisé IA AlgoPronos en plus du bonus de bienvenue standard 1xBet.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Le code promo 1xBet AlgoPronos fonctionne-t-il à la fois au Bénin, en Côte d\'Ivoire et au Sénégal ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Oui. Le code ${PROMO_CODE} est un code affilié international 1xBet. Il fonctionne dans tous les pays où 1xBet est disponible, notamment au Bénin (MTN MoMo, Moov Money), en Côte d'Ivoire (Orange Money CI, MTN MoMo CI), au Sénégal (Wave, Orange Money) et dans toute l'Afrique de l'Ouest.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Quel moyen de paiement utiliser pour s\'inscrire sur 1xBet au Bénin ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Au Bénin, 1xBet accepte les dépôts via MTN MoMo Bénin, Moov Money et Celtiis Cash. Inscrivez-vous avec le code ${PROMO_CODE} via algopronos.com/1xbet/benin pour activer votre Compte Optimisé IA et effectuez votre premier dépôt via MTN MoMo Bénin.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Quel moyen de paiement utiliser pour s\'inscrire sur 1xBet en Côte d\'Ivoire ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `En Côte d'Ivoire, 1xBet accepte Orange Money CI, MTN MoMo CI et Moov Money CI. Inscrivez-vous avec le code ${PROMO_CODE} pour activer votre Compte Optimisé IA AlgoPronos.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Quel moyen de paiement utiliser pour s\'inscrire sur 1xBet au Sénégal ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Au Sénégal, 1xBet accepte Wave et Orange Money Sénégal (#144#391#). Wave est souvent le plus rapide pour les dépôts et retraits. Inscrivez-vous avec le code ${PROMO_CODE} depuis algopronos.com/1xbet/senegal.`,
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://algopronos.com' },
    { '@type': 'ListItem', position: 2, name: 'Code Promo 1xBet', item: 'https://algopronos.com/code-promo-1xbet' },
    { '@type': 'ListItem', position: 3, name: 'Bénin, CI & Sénégal', item: 'https://algopronos.com/code-promo-1xbet-benin-ci-sn' },
  ],
};

const COUNTRIES_FOCUS = [
  {
    slug: 'benin', name: 'Bénin', flag: '🇧🇯', nameAccusatif: 'au Bénin',
    payments: ['MTN MoMo', 'Moov Money', 'Celtiis Cash'],
    paymentNote: 'Dépôt instantané via MTN MoMo Bénin',
    highlights: ['Ligue 1 Bénin', 'Premier League', 'Champions League'],
    waText: `Bénin`,
  },
  {
    slug: 'cote-divoire', name: 'Côte d\'Ivoire', flag: '🇨🇮', nameAccusatif: 'en Côte d\'Ivoire',
    payments: ['Orange Money CI', 'MTN MoMo CI', 'Moov Money CI'],
    paymentNote: 'Orange Money, MTN MoMo ou Moov Money CI',
    highlights: ['MTN Ligue 1 CI', 'Premier League', 'Champions League'],
    waText: `Côte d'Ivoire`,
  },
  {
    slug: 'senegal', name: 'Sénégal', flag: '🇸🇳', nameAccusatif: 'au Sénégal',
    payments: ['Wave', 'Orange Money (#144#391#)', 'Free Money'],
    paymentNote: 'Wave ultra-rapide ou Orange Money Sénégal',
    highlights: ['Ligue Pro Sénégal', 'Premier League', 'Champions League'],
    waText: `Sénégal`,
  },
];

export default function CodePromoBeninCiSnPage() {
  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Header />

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-14 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <div className="absolute top-10 left-1/4 w-80 h-80 bg-primary rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-secondary rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <nav className="flex items-center justify-center gap-2 text-xs text-text-muted mb-8">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/code-promo-1xbet" className="hover:text-white transition-colors">Code Promo 1xBet</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Bénin · CI · Sénégal</span>
          </nav>

          <Badge variant="outline" className="mb-5 text-primary border-primary/30">
            🇧🇯 Bénin · 🇨🇮 Côte d&apos;Ivoire · 🇸🇳 Sénégal — Code officiel {CURRENT_YEAR}
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Code Promo 1xBet{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              Bénin, Côte d&apos;Ivoire & Sénégal
            </span>{' '}
            {CURRENT_YEAR}
          </h1>

          <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            Un seul code <strong className="text-primary">{PROMO_CODE}</strong> valable dans les 3 pays.
            Bonus de bienvenue 1xBet + <strong className="text-white">Compte Optimisé IA</strong> AlgoPronos. Gratuit.
          </p>

          <div className="bg-surface border border-primary/30 rounded-3xl p-8 max-w-sm mx-auto mb-10 shadow-xl shadow-primary/5">
            <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Code officiel — Bénin · CI · Sénégal</p>
            <CopyButton code={PROMO_CODE} />
            <div className="mt-6">
              <Link href={`/redirect?url=${encodeURIComponent(AFFILIATE_URL)}&bookmaker=1xBet`}>
                <Button variant="gradient" size="lg" className="w-full">
                  <Gift className="mr-2 h-5 w-5" />
                  Créer mon compte 1xBet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-text-muted">
            {[
              { icon: CheckCircle2, text: 'Bonus bienvenue 1xBet' },
              { icon: Brain, text: 'Compte Optimisé IA' },
              { icon: Zap, text: 'Générateur IA gratuit' },
              { icon: Shield, text: 'Vérificateur inclus' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARDS PAR PAYS ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Code {PROMO_CODE} — détails par pays
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Même code, même bonus, même Compte Optimisé IA — adapté aux réalités locales de chaque pays.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {COUNTRIES_FOCUS.map((c) => {
              const waMsg = encodeURIComponent(
                `✅ J'ai activé mon Compte Optimisé IA sur 1xBet ${c.flag} ${c.name} avec le code ${PROMO_CODE} !\n🤖 Rejoins-moi : https://algopronos.com/1xbet/${c.slug}`
              );
              return (
                <div key={c.slug} className="bg-background border border-surface-light rounded-2xl p-6 flex flex-col hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl">{c.flag}</span>
                    <div>
                      <h3 className="font-bold text-white">{c.name}</h3>
                      <p className="text-xs text-text-muted">Code {PROMO_CODE}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Paiements locaux</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.payments.map((p) => (
                        <span key={p} className="text-xs bg-surface border border-surface-light rounded-md px-2 py-1 text-text-secondary">
                          💳 {p}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-primary mt-2">{c.paymentNote}</p>
                  </div>

                  <div className="mb-5">
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Championnats analysés par l&apos;IA</p>
                    <ul className="space-y-1">
                      {c.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />{h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto space-y-2">
                    <Link href={`/1xbet/${c.slug}`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        Page 1xBet {c.name} <ArrowRight className="ml-1.5 h-3 w-3" />
                      </Button>
                    </Link>
                    <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" size="sm" className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10">
                        <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Partager {c.flag}
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Questions fréquentes — Bénin · CI · Sénégal
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

      {/* ── AUTRES PAYS ── */}
      <section className="py-10 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-white mb-4 text-center">1xBet dans les autres pays</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { slug: 'mali', name: 'Mali', flag: '🇲🇱' },
              { slug: 'togo', name: 'Togo', flag: '🇹🇬' },
              { slug: 'burkina-faso', name: 'Burkina Faso', flag: '🇧🇫' },
              { slug: 'niger', name: 'Niger', flag: '🇳🇪' },
              { slug: 'cameroun', name: 'Cameroun', flag: '🇨🇲' },
              { slug: 'guinee', name: 'Guinée', flag: '🇬🇳' },
              { slug: 'congo', name: 'Congo', flag: '🇨🇬' },
              { slug: 'gabon', name: 'Gabon', flag: '🇬🇦' },
              { slug: 'madagascar', name: 'Madagascar', flag: '🇲🇬' },
            ].map((c) => (
              <Link
                key={c.slug}
                href={`/1xbet/${c.slug}`}
                className="inline-flex items-center gap-2 bg-background border border-surface-light hover:border-primary/40 rounded-xl px-4 py-2 text-sm text-text-secondary hover:text-white transition-all"
              >
                <span>{c.flag}</span>
                <span>1xBet {c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

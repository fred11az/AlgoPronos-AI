import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/app/code-promo-1xbet/CopyButton';
import {
  X, CheckCircle2, Brain, ArrowRight, Gift, AlertTriangle,
  RefreshCw, ChevronRight, Zap, Shield,
} from 'lucide-react';

const PROMO_CODE = process.env.NEXT_PUBLIC_1XBET_PROMO_CODE || 'AlgoPronos';
const AFFILIATE_URL =
  process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL ||
  'https://refpa14435.com/L?tag=d_5346138m_1599c_&site=5346138&ad=1599';
const CURRENT_YEAR = new Date().getFullYear();

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `Pourquoi votre ancien code promo 1xBet ne fonctionne plus en ${CURRENT_YEAR} — AlgoPronos`,
  description: `Vous avez utilisé un vieux code promo 1xBet et ça ne marche plus ? Découvrez pourquoi les codes génériques expirent et comment le code AlgoPronos active votre Compte Optimisé IA gratuitement en ${CURRENT_YEAR}.`,
  keywords: [
    `ancien code promo 1xbet ${CURRENT_YEAR}`,
    'code promo 1xbet expiré',
    'code 1xbet ne fonctionne plus',
    'pourquoi code promo 1xbet invalide',
    'nouveau code promo 1xbet afrique',
    `meilleur code promo 1xbet ${CURRENT_YEAR}`,
    'code 1xbet compte optimisé ia',
    'algopronos code promo',
    'code promo 1xbet bénin',
    'code promo 1xbet côte d\'ivoire',
    'code promo 1xbet sénégal',
  ].join(', '),
  alternates: { canonical: `https://algopronos.com/ancien-code-promo-1xbet` },
  openGraph: {
    title: `Pourquoi votre ancien code promo 1xBet ne fonctionne plus — AlgoPronos ${CURRENT_YEAR}`,
    description: `Codes 1xBet expirés : causes + solution. Le code AlgoPronos est le seul activant le Compte Optimisé IA. Gratuit.`,
    url: 'https://algopronos.com/ancien-code-promo-1xbet',
    siteName: 'AlgoPronos AI',
    type: 'article',
    locale: 'fr_FR',
  },
};

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: `Pourquoi votre ancien code promo 1xBet ne fonctionne plus en ${CURRENT_YEAR}`,
  description: `Les codes promo 1xBet génériques expirent rapidement. Seul le code AlgoPronos lie votre compte 1xBet à l'écosystème IA AlgoPronos pour activer le Compte Optimisé IA.`,
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
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://algopronos.com/ancien-code-promo-1xbet' },
  about: { '@type': 'Thing', name: 'Code promo 1xBet Afrique' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: `Pourquoi mon code promo 1xBet ne fonctionne plus en ${CURRENT_YEAR} ?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Les codes promo 1xBet génériques trouvés sur des sites non officiels expirent souvent après quelques semaines ou mois. Ils ne sont pas maintenus et 1xBet les désactive. Le code AlgoPronos est un code affilié officiel maintenu en permanence, valable ${CURRENT_YEAR} et au-delà. En plus de l'activer, il lie votre compte à l'écosystème AlgoPronos pour le statut Compte Optimisé IA.`,
      },
    },
    {
      '@type': 'Question',
      name: `Quel est le code promo 1xBet officiel qui fonctionne en ${CURRENT_YEAR} ?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Le code promo 1xBet officiel AlgoPronos est ${PROMO_CODE}. C'est le seul code qui (1) fonctionne garantie ${CURRENT_YEAR}, (2) active le bonus de bienvenue 1xBet, et (3) relie votre compte à la plateforme IA AlgoPronos pour le Compte Optimisé IA. Les autres codes trouvés sur internet ne donnent pas accès à l'écosystème AlgoPronos.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Que se passe-t-il si j\'utilise un mauvais code promo sur 1xBet ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Si vous utilisez un code promo 1xBet expiré ou invalide, votre compte sera créé mais sans bonus de bienvenue. Pire : votre compte ne sera pas reconnu par l'algorithme AlgoPronos, ce qui vous exclut du système Compte Optimisé IA. Vous ne pourrez pas bénéficier des analyses personnalisées d'AlgoPronos.`,
      },
    },
    {
      '@type': 'Question',
      name: `Peut-on changer son code promo 1xBet après inscription ?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Non. Le code promo 1xBet ne peut être saisi qu'au moment de la création du compte. Une fois inscrit sans le bon code, il est impossible de l'ajouter après. Si vous vous êtes inscrit avec un mauvais code, la solution est de créer un nouveau compte avec le code ${PROMO_CODE} depuis algopronos.com/code-promo-1xbet.`,
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
    { '@type': 'ListItem', position: 3, name: 'Ancien code promo 1xBet', item: 'https://algopronos.com/ancien-code-promo-1xbet' },
  ],
};

// ─── Comparatif codes ─────────────────────────────────────────────────────────

const OLD_CODES = [
  { code: 'WELCOME', statut: 'Expiré', raison: 'Code générique désactivé par 1xBet' },
  { code: 'BONUS200', statut: 'Invalide', raison: 'Jamais validé officieusement' },
  { code: 'AFRICA2024', statut: 'Expiré', raison: 'Valable uniquement en 2024' },
  { code: 'PROMO50', statut: 'Invalide', raison: 'Code non officiel, risque de refus' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AncienCodePromoPage() {
  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Header />

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-14 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-15">
          <div className="absolute top-10 left-1/4 w-80 h-80 bg-primary rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10">
          <nav className="flex items-center gap-2 text-xs text-text-muted mb-8">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/code-promo-1xbet" className="hover:text-white transition-colors">Code Promo 1xBet</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Ancien code ne fonctionne plus</span>
          </nav>

          <Badge variant="outline" className="mb-5 text-warning border-warning/30">
            ⚠️ Mise à jour {CURRENT_YEAR} — Codes expirés identifiés
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
            Pourquoi votre ancien code promo 1xBet ne fonctionne plus
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00D4FF]">
              {' '}— et comment activer l&apos;IA
            </span>
          </h1>

          <p className="text-lg text-text-secondary mb-4 leading-relaxed">
            Des milliers de parieurs africains utilisent chaque jour des codes 1xBet récupérés sur des sites tiers.
            La majorité de ces codes sont <strong className="text-white">expirés, invalides ou jamais officiels</strong>.
            Résultat : pas de bonus, pas d&apos;accès à l&apos;IA AlgoPronos.
          </p>
          <p className="text-sm text-text-muted">
            Temps de lecture : 3 min · Publié et mis à jour {CURRENT_YEAR}
          </p>
        </div>
      </section>

      {/* ── ALERTE CODES EXPIRÉS ── */}
      <section className="py-12 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <h2 className="text-lg font-bold text-warning">
                Codes promo 1xBet qui ne fonctionnent plus en {CURRENT_YEAR}
              </h2>
            </div>
            <p className="text-sm text-text-secondary mb-5">
              Ces codes sont régulièrement retrouvés sur des sites non officiels. Ils sont <strong className="text-white">désactivés ou n&apos;ont jamais fonctionné</strong>.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-light">
                    <th className="text-left py-2 pr-4 text-text-muted font-medium">Code</th>
                    <th className="text-left py-2 pr-4 text-text-muted font-medium">Statut</th>
                    <th className="text-left py-2 text-text-muted font-medium">Raison</th>
                  </tr>
                </thead>
                <tbody>
                  {OLD_CODES.map((row) => (
                    <tr key={row.code} className="border-b border-surface-light/50">
                      <td className="py-2.5 pr-4 font-mono text-text-secondary line-through">{row.code}</td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center gap-1 text-error text-xs font-medium">
                          <X className="h-3 w-3" /> {row.statut}
                        </span>
                      </td>
                      <td className="py-2.5 text-text-muted">{row.raison}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Code officiel */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <h2 className="text-lg font-bold text-primary">
                Le seul code officiel {CURRENT_YEAR} — {PROMO_CODE}
              </h2>
            </div>
            <p className="text-sm text-text-secondary mb-5">
              Le code <strong className="text-white">{PROMO_CODE}</strong> est un code affilié officiel AlgoPronos.
              Il est maintenu en permanence et active le <strong className="text-white">Compte Optimisé IA</strong> — l&apos;accès à l&apos;écosystème AlgoPronos.
            </p>
            <CopyButton code={PROMO_CODE} />
            <div className="mt-5">
              <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="gradient" size="lg" className="w-full">
                  <Gift className="mr-2 h-5 w-5" />
                  Créer mon compte 1xBet avec {PROMO_CODE}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── POURQUOI LES VIEUX CODES EXPIRENT ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-3">
            Pourquoi les codes promo 1xBet expirent-ils ?
          </h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            1xBet gère un réseau mondial de milliers d&apos;affiliés. Chaque affilié dispose de son propre code de suivi.
            Quand un affilié arrête son partenariat ou ne respecte pas les conditions, 1xBet désactive son code.
            Les sites qui publient des &quot;listes de codes&quot; recyclent des codes périmés sans jamais les vérifier.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              {
                icon: RefreshCw,
                color: 'text-warning',
                bg: 'bg-warning/10',
                title: 'Durée de vie limitée',
                desc: 'Un code générique peut être désactivé par 1xBet sans préavis dès que le partenariat affilié expire.',
              },
              {
                icon: X,
                color: 'text-error',
                bg: 'bg-error/10',
                title: 'Codes jamais officiels',
                desc: 'Certains codes publiés sur des forums n\'ont jamais été validés par 1xBet. Ils semblent fonctionner mais le bonus n\'est jamais crédité.',
              },
              {
                icon: AlertTriangle,
                color: 'text-warning',
                bg: 'bg-warning/10',
                title: 'Pas de lien à l\'écosystème IA',
                desc: 'Même si un vieux code active un bonus, il ne lie pas votre compte à la plateforme AlgoPronos. Pas de Compte Optimisé IA.',
              },
              {
                icon: Brain,
                color: 'text-primary',
                bg: 'bg-primary/10',
                title: `${PROMO_CODE} : affilié officiel maintenu`,
                desc: `Le code ${PROMO_CODE} est un code affilié 1xBet officiel d'AlgoPronos, actif et maintenu. Garanti valable ${CURRENT_YEAR} et au-delà.`,
              },
            ].map((item, i) => (
              <div key={i} className="bg-surface border border-surface-light rounded-2xl p-5 flex gap-4">
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Différence entre un code générique et le code {PROMO_CODE}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-surface-light">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-surface-light">
                  <th className="text-left p-4 text-text-muted font-medium">Critère</th>
                  <th className="text-center p-4 text-text-muted font-medium">Code générique</th>
                  <th className="text-center p-4 text-primary font-medium">Code {PROMO_CODE}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Fonctionne en ' + CURRENT_YEAR, false, true],
                  ['Bonus de bienvenue 1xBet', 'Incertain', true],
                  ['Compte Optimisé IA AlgoPronos', false, true],
                  ['Accès au générateur IA', false, true],
                  ['Vérificateur de compte', false, true],
                  ['Maintenu officiellement', false, true],
                ].map(([critere, generic, algo], i) => (
                  <tr key={i} className="border-b border-surface-light/50">
                    <td className="p-4 text-text-secondary">{critere as string}</td>
                    <td className="p-4 text-center">
                      {generic === false ? <X className="h-4 w-4 text-error mx-auto" /> :
                       generic === true ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" /> :
                       <span className="text-warning text-xs">{generic as string}</span>}
                    </td>
                    <td className="p-4 text-center">
                      {algo === true ? <CheckCircle2 className="h-4 w-4 text-primary mx-auto" /> :
                       <X className="h-4 w-4 text-error mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── ÉTAPES ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-3 text-center">
            Comment activer l&apos;IA 1xBet avec le bon code en {CURRENT_YEAR}
          </h2>
          <p className="text-text-secondary text-center mb-10">3 étapes · moins de 2 minutes</p>
          <ol className="space-y-4">
            {[
              {
                n: '1', icon: Zap, title: `Copiez ${PROMO_CODE}`,
                desc: `Cliquez sur le code ci-dessus pour le copier. Ne tapez pas d'autres codes trouvés ailleurs.`,
              },
              {
                n: '2', icon: Gift, title: 'Inscrivez-vous sur 1xBet via AlgoPronos',
                desc: `Cliquez sur "Créer mon compte 1xBet". Sur le formulaire 1xBet, collez ${PROMO_CODE} dans le champ "Code promo".`,
              },
              {
                n: '3', icon: Shield, title: 'Vérifiez votre statut Optimisé IA',
                desc: `Revenez sur AlgoPronos et utilisez le vérificateur gratuit (algopronos.com/verificateur-compte) pour confirmer votre statut.`,
              },
            ].map((step, i) => (
              <li key={i} className="flex gap-4 bg-background border border-surface-light rounded-2xl p-5 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/50 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-primary" /> {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <a href={AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gradient" size="lg">
                <Gift className="mr-2 h-5 w-5" />
                Créer mon compte 1xBet — Code {PROMO_CODE}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Questions fréquentes — Code promo 1xBet {CURRENT_YEAR}
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
              { href: '/code-promo-1xbet', label: 'Code Promo 1xBet Afrique' },
              { href: '/compte-optimise-ia', label: 'Compte Optimisé IA' },
              { href: '/verificateur-compte', label: 'Vérificateur de compte' },
              { href: '/retrait-1xbet-orange-money', label: 'Retrait 1xBet Orange Money' },
              { href: '/1xbet/senegal', label: '1xBet Sénégal' },
              { href: '/1xbet/benin', label: '1xBet Bénin' },
              { href: '/1xbet/cote-divoire', label: '1xBet Côte d\'Ivoire' },
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

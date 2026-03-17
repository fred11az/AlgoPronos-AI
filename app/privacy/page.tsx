import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — AlgoPronos AI',
  description: 'Découvrez comment AlgoPronos AI protège vos données personnelles et respecte votre vie privée.',
  alternates: {
    canonical: 'https://algopronos.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8">Politique de Confidentialité</h1>
        <div className="prose prose-invert prose-primary max-w-none space-y-6 text-text-secondary">
          <p>Chez AlgoPronos AI, la protection de vos données personnelles est une priorité. Cette politique détaille comment nous collectons et utilisons vos informations.</p>
          <section>
            <h2 className="text-2xl font-semibold text-white">1. Collecte des Données</h2>
            <p>Nous collectons les informations que vous nous fournissez lors de votre inscription (email, nom) et les données relatives à votre utilisation de la plateforme.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">2. Utilisation des Données</h2>
            <p>Vos données sont utilisées pour personnaliser votre expérience, vous envoyer nos pronostics et améliorer nos algorithmes d&apos;IA.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">3. Partage des Données</h2>
            <p>Nous ne vendons jamais vos données à des tiers. Vos informations peuvent être partagées avec nos partenaires bookmakers uniquement dans le cadre de l&apos;activation de votre compte Optimisé IA.</p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}

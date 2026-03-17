import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions Légales — AlgoPronos AI',
  description: 'Consultez les mentions légales d\'AlgoPronos AI, incluant les informations sur l\'éditeur du site et l\'hébergement.',
  alternates: {
    canonical: 'https://algopronos.com/legal',
  },
};

export default function LegalPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8">Mentions Légales</h1>
        <div className="prose prose-invert prose-primary max-w-none space-y-6 text-text-secondary">
          <section>
            <h2 className="text-2xl font-semibold text-white">Éditeur du Site</h2>
            <p>Le site AlgoPronos AI est édité par l&apos;équipe AlgoPronos, basée à Cotonou, Bénin.</p>
            <p>Email : contact@algopronos.ai</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">Hébergement</h2>
            <p>Le site est hébergé par Vercel Inc., 701 Harrison St, San Francisco, CA 94107, USA.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">Contact</h2>
            <p>Pour toute question relative au site ou à son contenu, vous pouvez nous contacter via notre page de support ou par email.</p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}

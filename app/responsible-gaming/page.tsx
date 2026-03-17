import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jeu Responsable — AlgoPronos AI',
  description: 'Nos conseils pour un jeu responsable et maîtrisé. Le jeu doit rester un plaisir. Découvrez comment parier avec modération.',
  alternates: {
    canonical: 'https://algopronos.com/responsible-gaming',
  },
};

export default function ResponsibleGamingPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8">Jeu Responsable</h1>
        <div className="prose prose-invert prose-primary max-w-none space-y-6 text-text-secondary">
          <p className="text-lg font-medium text-primary">Le jeu doit rester un plaisir. Jouez avec modération.</p>
          <section>
            <h2 className="text-2xl font-semibold text-white">Nos Conseils</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ne misez que ce que vous pouvez vous permettre de perdre.</li>
              <li>Fixez-vous des limites de temps et d&apos;argent.</li>
              <li>Ne voyez pas le jeu comme un moyen de gagner de l&apos;argent rapidement.</li>
              <li>Ne tentez pas de vous refaire après une perte.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">Besoin d&apos;Aide ?</h2>
            <p>Si vous pensez avoir un problème avec le jeu, parlez-en à des professionnels ou tournez-vous vers des associations spécialisées dans votre pays.</p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}

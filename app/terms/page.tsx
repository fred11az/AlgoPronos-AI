import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8">Conditions d&apos;Utilisation</h1>
        <div className="prose prose-invert prose-primary max-w-none space-y-6 text-text-secondary">
          <section>
            <h2 className="text-2xl font-semibold text-white">1. Acceptation des Conditions</h2>
            <p>En accédant et en utilisant AlgoPronos AI, vous acceptez d&apos;être lié par les présentes conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">2. Nature du Service</h2>
            <p>AlgoPronos AI fournit des analyses basées sur l&apos;intelligence artificielle pour les matchs de football. Ces analyses sont fournies à titre informatif uniquement et ne constituent pas des conseils financiers ou des garanties de gain.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">3. Responsabilité</h2>
            <p>Les paris sportifs comportent des risques financiers. AlgoPronos AI ne pourra être tenu responsable des pertes financières subies par les utilisateurs. Vous jouez sous votre propre responsabilité.</p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-white">4. Propriété Intellectuelle</h2>
            <p>Tout le contenu présent sur AlgoPronos AI (algorithmes, textes, logos, analyses) est la propriété exclusive de notre plateforme.</p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}

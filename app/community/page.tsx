import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { MessageSquare, Users, Star, ArrowRight } from 'lucide-react';

export default function CommunityPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">La Communauté AlgoPronos AI</h1>
        <p className="text-center text-text-secondary text-lg max-w-2xl mx-auto mb-16">
          Rejoignez des milliers de passionnés de football et profitez de l&apos;intelligence artificielle pour vos paris sportifs.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-surface-light/30 border border-surface-light p-8 rounded-3xl">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Canal Télégram</h3>
            <p className="text-text-secondary mb-8">
              Recevez nos 2 coupons IA gratuits chaque jour directement sur votre téléphone. Analyses en direct et conseils exclusifs.
            </p>
            <a href="https://t.me/algopronos" target="_blank" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
              Rejoindre le canal <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          <div className="bg-surface-light/30 border border-surface-light p-8 rounded-3xl">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Support & Aide</h3>
            <p className="text-text-secondary mb-8">
              Notre équipe de modérateurs et d&apos;experts en IA est disponible pour activer vos comptes VIP et répondre à vos questions.
            </p>
            <a href="/contact" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
              Contacter le support <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-16 p-8 bg-primary/5 border border-primary/20 rounded-3xl text-center">
          <Star className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">+15,000 Membres actifs</h2>
          <p className="text-text-secondary">Déjà plus de 15,000 parieurs nous font confiance à travers toute l&apos;Afrique.</p>
        </div>
      </div>
    </MarketingLayout>
  );
}

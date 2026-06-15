import type { Metadata } from 'next';
import { MobcashForm } from '@/components/mobcash/MobcashForm';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';

export const metadata: Metadata = {
  title: 'Dépôt & Retrait MobCash 1xBet | AlgoPronos AI',
  description: 'Effectuez vos dépôts et retraits 1xBet via MobCash rapidement et en toute sécurité avec AlgoPronos.',
};

export default function DepotRetraitPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-primary text-sm font-semibold">💳 Caisse MobCash</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Dépôt & Retrait 1xBet
            </h1>
            <p className="text-text-secondary text-lg">
              Déposez ou retirez vos fonds 1xBet via notre caisse MobCash.
              Votre demande est traitée rapidement par notre équipe.
            </p>
          </div>

          <MobcashForm />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '⚡', title: 'Rapide', desc: 'Traitement en quelques minutes' },
              { icon: '🔒', title: 'Sécurisé', desc: 'Vos fonds sont en sécurité' },
              { icon: '📞', title: 'Support', desc: 'Notre équipe vous accompagne' },
            ].map(item => (
              <div key={item.title} className="bg-surface border border-surface-light rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-text-muted text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

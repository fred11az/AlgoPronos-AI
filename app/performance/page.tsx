import { Metadata } from 'next';
import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { PerformanceClient } from '@/components/performance/PerformanceClient';

export const metadata: Metadata = {
  title: 'Performance & Historique — AlgoPronos AI',
  description: 'Consultez le ROI, le taux de réussite et l\'historique complet de notre algorithme de prédiction football Dixon-Coles.',
};

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary/30">
      <Header />
      
      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-4 uppercase tracking-wider">
              Vérifié par RapidAPI
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Performance <span className="text-primary">Vérifiable</span>
            </h1>
            <p className="text-text-muted text-lg max-w-3xl leading-relaxed">
              La transparence est notre pilier. Ici, vous pouvez suivre en temps réel le ROI cumulé, 
              le taux de réussite par marché et l'historique complet de chaque pronostic généré par notre IA.
            </p>
          </header>

          <PerformanceClient />
        </div>
      </main>

      <Footer />
    </div>
  );
}

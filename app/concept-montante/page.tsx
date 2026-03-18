import { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, ShieldCheck, Zap, ArrowRight, BarChart3, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'La Montante AlgoPronos — La Stratégie Boule de Neige IA',
  description: 'Découvrez comment notre algorithme sélectionne l\'événement le plus sûr du jour pour une montante mathématique optimisée. Risque minimum, profits maximum.',
};

export default function MontantePage() {
  return (
    <main className="min-h-screen bg-background text-white selection:bg-primary/30">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4">
            <Zap className="h-3 w-3" />
            Stratégie "Snowball" IA
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-tight">
            La Montante <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Mathématique</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
            L'algorithme AlgoPronos scanne des milliers d'événements pour n'en retenir qu'un seul : 
            celui qui présente le <span className="text-white font-bold">taux de probabilité le plus élevé au monde</span>.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/matchs?tab=montante" 
              className="px-8 py-4 bg-primary text-background font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 group shadow-lg shadow-primary/20"
            >
              Voir le palier du jour
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Concept Grid */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-surface border border-white/5 p-8 rounded-3xl hover:border-primary/30 transition-colors group">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-primary h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-4">Sélection Ultra-Safe</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Nous ciblons uniquement des cotes entre 1.30 et 1.45 avec une probabilité réelle calculée supérieure à 85%.
            </p>
          </div>

          <div className="bg-surface border border-white/5 p-8 rounded-3xl hover:border-primary/30 transition-colors group">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 border border-secondary/20 group-hover:scale-110 transition-transform">
              <BarChart3 className="text-secondary h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-4">Progression Linéaire</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              L'objectif est de monter par paliers. Chaque gain finance la mise du lendemain. Zéro apport personnel après le jour 1.
            </p>
          </div>

          <div className="bg-surface border border-white/5 p-8 rounded-3xl hover:border-primary/30 transition-colors group">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
              <Layers className="text-white h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-4">Gestion du Capital</h3>
            <p className="text-text-muted text-sm leading-relaxed">
              En cas d'échec, nous repartons d'un capital fixe. Notre IA optimise le point d'arrêt pour sécuriser vos bénéfices.
            </p>
          </div>
        </div>
      </section>

      {/* Visual representation */}
      <section className="max-w-4xl mx-auto px-4 py-20 bg-surface/30 rounded-3xl border border-white/5 mb-20 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">La Science du "Snowball"</h2>
          <p className="text-text-muted">Visualisez la puissance des intérêts composés appliqués aux pronostics.</p>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 items-end h-40">
          {[1, 2, 4, 8, 12, 18, 25, 35, 50, 75].map((h, i) => (
            <div 
              key={i} 
              className="bg-primary/40 border-t border-x border-primary/40 rounded-t-lg transition-all hover:bg-primary"
              style={{ height: `${h}%` }}
              title={`Étape ${i+1}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
          <span>Départ</span>
          <span>Objectif Final</span>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 rounded-[2rem] p-10 text-center">
          <h2 className="text-3xl font-black mb-6 italic">Prêt à démarrer l'ascension ?</h2>
          <p className="text-text-muted mb-8 max-w-xl mx-auto">
            La Montante est réinitialisée automatiquement après chaque cycle validé ou chaque échec. 
            Vérifiez l'étape actuelle sur votre tableau de bord.
          </p>
          <Link 
            href="/matchs?tab=montante" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl"
          >
            Vérifier l'étape en cours
            <TrendingUp className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

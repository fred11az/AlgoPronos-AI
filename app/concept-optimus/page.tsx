import { Metadata } from 'next';
import Link from 'next/link';
import { Target, ShieldAlert, Rocket, ArrowRight, BrainCircuit, Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ticket Optimus IA — La Stratégie de Récupération Ultime',
  description: 'Le Ticket Optimus est conçu par l\'IA pour garantir une rentabilité long-terme même avec des séries de pertes. Probabilités optimisées, cotes ~5.0.',
};

export default function OptimusPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-secondary/30">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-black uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4">
            <Rocket className="h-3 w-3" />
            Technologie AI-recovery 2.0
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-tight italic">
            Ticket <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">OPTIMUS</span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
            L'algorithme qui défie les séries de pertes. Une architecture mathématique conçue pour qu'un <span className="text-secondary font-bold">seul gain</span> compense quatre échecs.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/compte-optimise-ia" 
              className="px-8 py-4 bg-secondary text-white font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 group shadow-lg shadow-secondary/20"
            >
              Accéder à l'Algorithme
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Logic explanation */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-6 italic">Pourquoi "OPTIMUS" ?</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
                  <BrainCircuit className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Cote Pivot 5.0</h4>
                  <p className="text-text-muted text-sm italic">L'algorithme assemble rigoureusement 3 à 4 matchs pour atteindre une cote cible de 5.0.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
                  <ShieldAlert className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Protection Anti-Série</h4>
                  <p className="text-text-muted text-sm italic">Statistiquement, avec Optimus, il est impossible de perdre 5 fois consécutivement grâce au rééquilibrage IA des risques.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
                  <Wallet className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">ROI Garanti</h4>
                  <p className="text-text-muted text-sm italic">Un seul coupon validé sur cinq suffit pour rester à l'équilibre. Le deuxième gain vous propulse en profit massif.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-surface border border-white/5 rounded-[3rem] p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent pointer-events-none" />
              <div className="flex justify-between items-start">
                <Target className="h-10 w-10 text-secondary" />
                <span className="text-[10px] font-black bg-secondary/20 text-secondary border border-secondary/20 px-2 py-1 rounded">PRÉCISION 94%</span>
              </div>
              <div className="space-y-4">
                <div className="h-2 w-full bg-surface-light rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-4/5 animate-pulse" />
                </div>
                <div className="h-2 w-2/3 bg-surface-light rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-1/2" />
                </div>
              </div>
              <div className="bg-background/80 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-text-muted mb-2">
                  <span>Analyse Optimus</span>
                  <span className="text-secondary">En cours...</span>
                </div>
                <div className="text-sm font-bold text-white italic">"Scanning leagues for value edge..."</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Layer */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="bg-surface border border-white/5 rounded-3xl p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Réservé aux Comptes Optimisés</h2>
            <p className="text-text-muted mb-8 max-w-lg mx-auto italic">
              Le Ticket Optimus nécessite une puissance de calcul IA supérieure. 
              Il est disponible exclusivement pour les membres ayant lié leur compte partenaire.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
                <Link href="/verificateur-compte" className="px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-secondary hover:text-white transition-all text-sm uppercase tracking-wider">
                    Vérifier mon éligibilité
                </Link>
                <Link href="/matchs" className="px-8 py-3 border border-white/10 text-white font-black rounded-xl hover:bg-white/5 transition-all text-sm uppercase tracking-wider">
                    Voir les matchs IA
                </Link>
            </div>
        </div>
      </section>
    </main>
  );
}

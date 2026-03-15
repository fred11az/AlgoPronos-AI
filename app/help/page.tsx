import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { HelpCircle, Zap, Shield, User } from 'lucide-react';

const faqs = [
  {
    q: "Qu'est-ce qu'un compte bookmaker Optimisé IA ?",
    a: "C'est un compte créé via notre plateforme en utilisant nos liens officiels 1xBet ou autres bookmakers partenaires. Ces comptes bénéficient de notre algorithme d'IA pour des bonus spécifiques et une meilleure gestion des xG."
  },
  {
    q: "AlgoPronos AI est-il vraiment gratuit ?",
    a: "Oui, l'accès à nos pronostics publics et à la création de compte optimisé est 100% gratuit."
  },
  {
    q: "Comment puis-je activer mon accès VIP ?",
    a: "Pour activer votre accès VIP, vous devez créer votre compte via AlgoPronos et soumettre votre ID bookmaker dans votre profil."
  }
];

export default function HelpPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8">Centre d&apos;Aide</h1>
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <HelpCard icon={<Zap />} title="Débuter" desc="Apprenez à utiliser nos IA." />
          <HelpCard icon={<Shield />} title="Sécurité" desc="Gérez votre compte VIP." />
          <HelpCard icon={<User />} title="Support" desc="Contactez nos experts." />
        </div>
        
        <div className="space-y-8 mt-12">
          <h2 className="text-2xl font-bold text-white">Questions Fréquentes</h2>
          <div className="space-y-6">
            {faqs.map((f, i) => (
              <div key={i} className="bg-surface-light/30 border border-surface-light p-6 rounded-2xl">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" /> {f.q}
                </h3>
                <p className="text-text-secondary leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

function HelpCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-surface border border-surface-light p-6 rounded-3xl hover:border-primary/50 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-text-muted">{desc}</p>
    </div>
  );
}

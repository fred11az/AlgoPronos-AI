import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Mail, Phone, MapPin } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contactez AlgoPronos AI — Support et Partenariats',
  description: 'Une question sur nos pronostics ou votre compte ? Contactez l\'équipe AlgoPronos via email, WhatsApp ou notre formulaire de contact.',
  alternates: {
    canonical: 'https://algopronos.com/contact',
  },
};

export default function ContactPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Contactez-nous</h1>
        <div className="grid md:grid-cols-2 gap-12 mt-12">
          <div className="space-y-8">
            <p className="text-text-secondary leading-relaxed text-lg">
              Une question sur nos pronostics ou votre compte Optimisé IA ? Notre équipe est là pour vous aider du lundi au samedi.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Par email</p>
                  <p className="text-lg font-medium text-white">contact@algopronos.ai</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Par téléphone / WhatsApp</p>
                  <p className="text-lg font-medium text-white">+229 97 00 00 00</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Localisation</p>
                  <p className="text-lg font-medium text-white">Cotonou, Bénin</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-light/50 border border-surface-light p-8 rounded-3xl shadow-xl">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Votre Nom</label>
                <input type="text" className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all" placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                <input type="email" className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all" placeholder="jean@mail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Message</label>
                <textarea rows={4} className="w-full bg-background border border-surface-light rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all" placeholder="Comment pouvons-nous vous aider ?"></textarea>
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20">
                Envoyer le Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

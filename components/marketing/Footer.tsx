import Link from 'next/link';
import {
  Facebook,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const footerLinks = {
  product: [
    { label: 'Compte optimisé IA', href: '/compte-optimise-ia' },
    { label: 'Générateur de tickets', href: '/dashboard/generate' },
    { label: 'Comment ça marche', href: '/#how-it-works' },
    { label: 'Performance & ROI', href: '/performance' },
    { label: 'Historique des tickets', href: '/dashboard/history' },
  ],
  legal: [
    { label: 'Conditions d\'utilisation', href: '/terms' },
    { label: 'Politique de confidentialité', href: '/privacy' },
    { label: 'Mentions légales', href: '/legal' },
    { label: 'Jeu responsable', href: '/responsible-gaming' },
  ],
  support: [
    { label: 'Centre d\'aide', href: '/help' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Communauté', href: '/community' },
  ],
  explore: [
    { label: 'Analyse Multiplicateurs', href: '/data-analysis-multipliers' },
    { label: 'Modèles Probabilistes', href: '/probability-optimization-models' },
    { label: 'Code Promo Partenaire', href: '/code-promo' },
    { label: 'Tous les liens', href: '/autres-liens' },
  ],
};

const socialLinks = [
  { icon: Facebook,      href: 'https://facebook.com/profile.php?id=61583768136277', label: 'Facebook' },
  { icon: Twitter,       href: 'https://x.com/algopronos_ai?s=21',                label: 'Twitter' },
  { icon: Youtube,       href: 'https://youtube.com/@algopronos_ai?si=_L_yVbJrXNkahAJ6', label: 'Youtube' },
  { icon: Send,          href: 'https://t.me/AlgoPronosAI',                       label: 'Telegram' },
  { icon: MessageCircle, href: 'https://wa.me/22956991777',                        label: 'WhatsApp' },
];

export function Footer() {
  return (
    <footer className="bg-surface border-t border-surface-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Logo size="lg" />
            <p className="mt-4 text-text-secondary text-sm leading-relaxed">
              Plateforme 100% gratuite de génération automatique de combinés de paris
              sportifs propulsée par l&apos;IA. 2 coupons par jour.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produit</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Légal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explorer */}
          <div>
            <h4 className="font-semibold text-white mb-4">Explorer</h4>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-text-secondary text-sm">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:algo@buubronasu.resend.app" className="hover:text-primary transition-colors">
                  Contactez-nous
                </a>
              </li>
              <li className="flex items-center gap-3 text-text-secondary text-sm">
                <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="https://wa.me/22956991777" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-start gap-3 text-text-secondary text-sm">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Cotonou, Bénin</span>
              </li>
            </ul>
          </div>
        </div>

        {/* SEO Description Block */}
        <div className="mt-12 pt-8 border-t border-surface-light">
          <div className="max-w-4xl">
            <h4 className="text-white font-semibold mb-3">AlgoPronos AI : Expert en Compte Optimisé IA</h4>
            <p className="text-text-muted text-xs leading-relaxed">
              AlgoPronos AI est la plateforme leader en Afrique pour la génération de pronostics par intelligence artificielle. 
              Notre innovation majeure, le <Link href="/compte-optimise-ia" className="text-primary hover:underline">Compte Optimisé IA</Link>, 
              permet une synchronisation unique entre votre bookmaker (Partenaire Premium et autres partenaires) et notre algorithme. 
              En utilisant le code promo officiel AlgoPronos, votre compte bénéficie de paramètres d&apos;analyse avancés 
              incluant les Expected Goals (xG), le Value Betting et l&apos;analyse de forme en temps réel. Que vous soyez 
              au Bénin, au Sénégal, en Côte d&apos;Ivoire ou au Cameroun, rejoignez la révolution des paris sportifs 
              intelligents 100% gratuitement.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-surface-light">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm text-center md:text-left" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} AlgoPronos AI. Tous droits réservés.
            </p>
            <p className="text-text-muted text-xs text-center md:text-right max-w-xl">
              Les paris sportifs comportent des risques. Jouez de manière responsable.
              Ce site est réservé aux personnes majeures. Les gains passés ne garantissent
              pas les gains futurs.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

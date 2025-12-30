import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Comment ça marche', href: '#how-it-works' },
    { label: 'Témoignages', href: '#testimonials' },
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
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

export function Footer() {
  return (
    <footer className="bg-surface border-t border-surface-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Logo size="lg" />
            <p className="mt-4 text-text-secondary text-sm leading-relaxed">
              Plateforme premium de génération automatique de combinés de paris
              sportifs propulsée par l'IA la plus avancée d'Afrique.
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

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-text-secondary text-sm">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>contact@algopronos.ai</span>
              </li>
              <li className="flex items-center gap-3 text-text-secondary text-sm">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+229 97 00 00 00</span>
              </li>
              <li className="flex items-start gap-3 text-text-secondary text-sm">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Cotonou, Bénin</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-surface-light">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm text-center md:text-left">
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

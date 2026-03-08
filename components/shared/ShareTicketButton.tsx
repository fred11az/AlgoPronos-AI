'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Copy,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  Check,
  ExternalLink,
} from 'lucide-react';

interface ShareTicketButtonProps {
  ticketId: string;
  totalOdds: number;
  confidencePct: number;
  matchCount: number;
  type?: 'combine' | 'daily';
  /** Variant for the trigger button */
  buttonVariant?: 'outline' | 'gradient' | 'ghost';
  /** Label for the trigger button */
  label?: string;
  className?: string;
}

export default function ShareTicketButton({
  ticketId,
  totalOdds,
  confidencePct,
  matchCount,
  type = 'combine',
  buttonVariant = 'outline',
  label = 'Partager',
  className = '',
}: ShareTicketButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://algopronos.ai';
  const publicUrl = `${appUrl}/ticket/${ticketId}`;
  const imageUrl = `${appUrl}/api/ticket-image/${ticketId}`;
  const label_ = type === 'daily' ? 'Ticket IA du Jour' : 'Mon Combiné IA';

  const shareText = `🤖 ${label_} — AlgoPronos AI\n\n${matchCount} sélections · Cote totale: ${totalOdds.toFixed(2)} · Confiance IA: ${confidencePct}%\n\n👉 ${publicUrl}`;

  const enc = (s: string) => encodeURIComponent(s);

  const socials = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20',
      href: `https://wa.me/?text=${enc(shareText)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-[#229ED9]/10 text-[#229ED9] border-[#229ED9]/30 hover:bg-[#229ED9]/20',
      href: `https://t.me/share/url?url=${enc(publicUrl)}&text=${enc(shareText)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2]/20',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(publicUrl)}`,
    },
    {
      name: 'X / Twitter',
      icon: Twitter,
      color: 'bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/20',
      href: `https://twitter.com/intent/tweet?text=${enc(shareText)}`,
    },
  ];

  function copyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({ title: label_, text: shareText, url: publicUrl });
    } else {
      setOpen(true);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Button variant={buttonVariant} onClick={nativeShare}>
        <Share2 className="mr-2 h-4 w-4" />
        {label}
      </Button>

      {/* Drawer (desktop fallback) */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="fixed bottom-0 left-0 right-0 z-50 sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
            <div className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">Partager ce ticket</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-text-muted hover:text-white transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>

              {/* Social grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {socials.map(s => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-medium text-sm transition-all ${s.color}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {s.name}
                    </a>
                  );
                })}
              </div>

              {/* Copy link */}
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-white hover:border-primary/40 transition-all"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </button>

              {/* View public page */}
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-white transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Voir la page publique
              </a>

              {/* Image preview */}
              <div className="mt-3 rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Aperçu du ticket"
                  className="w-full object-cover"
                  style={{ aspectRatio: '1200/630' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

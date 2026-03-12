'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-3 bg-primary/10 border-2 border-primary/40 hover:border-primary hover:bg-primary/20 rounded-2xl px-6 py-4 transition-all duration-200 cursor-pointer w-full max-w-sm mx-auto"
      aria-label="Copier le code promo"
    >
      <span className="text-2xl font-bold text-primary tracking-[0.15em] flex-1 text-center font-mono">
        {code}
      </span>
      <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/20 group-hover:bg-primary flex items-center justify-center transition-colors">
        {copied
          ? <Check className="h-4 w-4 text-primary group-hover:text-white" />
          : <Copy className="h-4 w-4 text-primary group-hover:text-white" />
        }
      </span>
    </button>
  );
}

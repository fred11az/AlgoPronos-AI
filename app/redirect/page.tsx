'use client';

import { useSearchParams } from 'next/navigation';
import { ImmersiveRedirect } from '@/components/shared/ImmersiveRedirect';
import { Suspense } from 'react';

function RedirectContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const bookmaker = searchParams.get('bookmaker') || 'Partenaire';

  if (!url) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-4 text-error">Erreur de redirection</h1>
          <p className="text-text-muted">L'URL de destination est manquante.</p>
          <a href="/" className="mt-6 inline-block text-primary hover:underline">Retourner à l'accueil</a>
        </div>
      </div>
    );
  }

  return <ImmersiveRedirect url={url} bookmaker={bookmaker} />;
}

export default function RedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0F1E]" />}>
      <RedirectContent />
    </Suspense>
  );
}

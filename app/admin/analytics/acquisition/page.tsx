/**
 * /admin/analytics/acquisition — Tableau de bord acquisition & conversion hebdo.
 * Sert à arbitrer chaque semaine entre pub Facebook et prospection terrain
 * (coût par inscrit, conversions 1xBet, ROI par canal, point de rentabilité).
 * Auth admin gérée par app/admin/layout.tsx.
 */
import { BarChart3 } from 'lucide-react';
import AcquisitionClient from './AcquisitionClient';

export const dynamic = 'force-dynamic';

export default function AcquisitionAnalyticsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Acquisition hebdomadaire</h1>
          <p className="text-text-secondary text-sm">
            Facebook Ads vs prospection terrain — coûts, conversions, ROI
          </p>
        </div>
      </div>
      <AcquisitionClient />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Analytics & Trafic</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Statistiques de Consultation
          </CardTitle>
          <CardDescription>Données issues de Supabase et Google Search Console</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <TrendingUp className="h-8 w-8" />
            </div>
            <p className="text-xl text-white font-bold">En attente de données SEO</p>
            <p className="text-text-muted mt-2 max-w-sm">
              Une fois votre site indexé par Google (sous 2 à 7 jours), les données de trafic Multiplicateurs et Pronostics apparaîtront ici. 
            </p>
            <div className="mt-8 p-4 bg-surface-light border border-surface-light rounded-2xl text-left max-w-md">
              <p className="text-xs font-semibold text-primary uppercase mb-2">Actions requises :</p>
              <ul className="text-xs text-text-secondary space-y-2">
                <li>• Ajouter le domaine sur <strong>Google Search Console</strong></li>
                <li>• Soumettre l&apos;URL du sitemap : <code className="text-white">/sitemap.xml</code></li>
                <li>• Attendre le premier passage du Googlebot (24-48h)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

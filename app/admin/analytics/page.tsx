import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users } from 'lucide-react';

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
            <p className="text-lg text-white font-medium">Analytics en cours de connexion</p>
            <p className="text-text-muted mt-2 max-w-sm">
              Connectez votre compte Google Search Console pour voir les impressions et clics SEO directement ici.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Bell, Shield, Database } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Paramètres de la Plateforme</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Sécurité & API
            </CardTitle>
            <CardDescription>Configuration des accès et clefs externes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-light border border-surface-light">
              <p className="text-sm text-text-secondary">Statut OpenRouter</p>
              <p className="text-success font-medium mt-1">Connecté (Clé Active)</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-light border border-surface-light">
              <p className="text-sm text-text-secondary">Statut OpenClaw Local</p>
              <p className="text-warning font-medium mt-1">Passerelle Port 18789 Détectée</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notifications Admin
            </CardTitle>
            <CardDescription>Emails de réception des demandes VIP</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="p-4 rounded-xl bg-surface-light border border-surface-light whitespace-pre-wrap">
              <p className="text-sm text-text-secondary">Emails configurés dans .env :</p>
              <p className="text-white font-mono text-xs mt-2">fgambakpo@gmail.com, algopronosai@gmail.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

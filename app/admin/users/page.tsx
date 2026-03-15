import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, ShieldCheck } from 'lucide-react';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Gestion des Utilisateurs</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Derniers Utilisateurs ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 border border-surface-light/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{user.full_name || 'Sans nom'}</p>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Badge variant={user.tier === 'verified' ? 'success' : 'outline'}>
                    {user.tier === 'verified' ? 'VIP Activé' : 'Standard'}
                  </Badge>
                </div>
              </div>
            ))}
            {!users?.length && <p className="text-center text-text-muted py-8">Aucun utilisateur trouvé.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

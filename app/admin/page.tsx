import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, CreditCard, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getAdminStats() {
  const supabase = await createClient();

  // Get total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get premium users
  const { count: premiumUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tier', 'premium');

  // Get VIP users
  const { count: vipUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tier', 'vip_lifetime');

  // Get pending verifications
  const { count: pendingVerifications } = await supabase
    .from('vip_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Get combines generated today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: combinesGenerated } = await supabase
    .from('generated_combines')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  // Get recent verifications
  const { data: recentVerifications } = await supabase
    .from('vip_verifications')
    .select(`
      *,
      user:profiles(id, email, full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    totalUsers: totalUsers || 0,
    premiumUsers: premiumUsers || 0,
    vipUsers: vipUsers || 0,
    pendingVerifications: pendingVerifications || 0,
    combinesGenerated: combinesGenerated || 0,
    monthlyRevenue: (premiumUsers || 0) * 1000 * 4, // Rough estimate
    recentVerifications: recentVerifications || [],
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-text-secondary">
          Vue d&apos;ensemble de la plateforme AlgoPronos AI
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Utilisateurs Totaux"
          value={stats.totalUsers}
          subtitle={`${stats.premiumUsers} Premium, ${stats.vipUsers} VIP`}
          icon={<Users className="h-6 w-6" />}
          trend="+12%"
        />
        <StatCard
          title="Vérifications en attente"
          value={stats.pendingVerifications}
          subtitle="À traiter"
          icon={<AlertCircle className="h-6 w-6" />}
          alert={stats.pendingVerifications > 0}
        />
        <StatCard
          title="Revenus ce mois"
          value={`${stats.monthlyRevenue.toLocaleString()} F`}
          subtitle="Premium + Affiliation"
          icon={<CreditCard className="h-6 w-6" />}
          trend="+28%"
        />
        <StatCard
          title="Combinés générés"
          value={stats.combinesGenerated}
          subtitle="Aujourd'hui"
          icon={<Zap className="h-6 w-6" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Verifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Vérifications VIP en attente
              </CardTitle>
              <CardDescription>
                {stats.pendingVerifications} demande(s) à traiter
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/verifications">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentVerifications.length > 0 ? (
              <div className="space-y-4">
                {stats.recentVerifications.map((verification: {
                  id: string;
                  user: { full_name: string; email: string } | null;
                  bookmaker_identifier: string;
                  created_at: string;
                }) => (
                  <div
                    key={verification.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-light/50"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {verification.user?.full_name || 'Utilisateur'}
                      </p>
                      <p className="text-sm text-text-muted">
                        {verification.user?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <code className="text-xs bg-background px-2 py-1 rounded text-primary">
                        {verification.bookmaker_identifier}
                      </code>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(verification.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-muted py-8">
                Aucune vérification en attente
              </p>
            )}
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Distribution des utilisateurs
            </CardTitle>
            <CardDescription>
              Répartition par type d&apos;abonnement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-text-secondary">VIP Lifetime</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{stats.vipUsers}</span>
                  <Badge variant="vip">
                    {stats.totalUsers > 0
                      ? Math.round((stats.vipUsers / stats.totalUsers) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-text-secondary">Premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{stats.premiumUsers}</span>
                  <Badge variant="premium">
                    {stats.totalUsers > 0
                      ? Math.round((stats.premiumUsers / stats.totalUsers) * 100)
                      : 0}
                    %
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-surface-light"></div>
                  <span className="text-text-secondary">Sans abonnement</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {stats.totalUsers - stats.vipUsers - stats.premiumUsers}
                  </span>
                  <Badge variant="outline">
                    {stats.totalUsers > 0
                      ? Math.round(
                          ((stats.totalUsers - stats.vipUsers - stats.premiumUsers) /
                            stats.totalUsers) *
                            100
                        )
                      : 0}
                    %
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  alert,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? 'border-warning/50' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              alert ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
            }`}
          >
            {icon}
          </div>
          {trend && (
            <Badge variant="success" className="text-xs">
              {trend}
            </Badge>
          )}
        </div>
        <p className="text-text-muted text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        <p className="text-xs text-text-muted mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

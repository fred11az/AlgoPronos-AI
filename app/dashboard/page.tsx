import Link from 'next/link';
import { getCurrentUser, getUserStats, getUserRecentCombines, getVipVerificationStatus } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  TrendingUp,
  Zap,
  History,
  ArrowRight,
  Trophy,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
} from 'lucide-react';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Connexion requise</h2>
            <p className="text-text-secondary mb-6">
              Connectez-vous pour accéder à votre tableau de bord
            </p>
            <Button variant="gradient" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isVerified = user?.tier === 'verified';

  // Fetch real data from Supabase
  const [stats, recentCombines, vipStatus] = await Promise.all([
    getUserStats(user.id),
    getUserRecentCombines(user.id, 5),
    getVipVerificationStatus(user.id),
  ]);

  const isPending = vipStatus.status === 'pending';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Bienvenue, {user.full_name || 'Utilisateur'}
          </h1>
          <p className="text-text-secondary mt-1">
            {isVerified
              ? 'Prêt à générer des combinés gagnants ?'
              : isPending
              ? 'Votre activation est en cours de vérification'
              : 'Activez votre compte pour commencer'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isVerified ? (
            <Button size="lg" variant="gradient" asChild>
              <Link href="/dashboard/generate">
                <Sparkles className="mr-2 h-5 w-5" />
                Générer un Combiné
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="gradient" asChild>
              <Link href="/unlock-vip">
                <Sparkles className="mr-2 h-5 w-5" />
                Activer Mon Compte
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Verification Status */}
      {!isVerified && isPending && (
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Vérification en cours</h3>
                <p className="text-text-secondary">
                  Votre compte 1xBet est en cours de vérification. Réponse sous 24h maximum.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activation Card (if not verified and not pending) */}
      {!isVerified && !isPending && (
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Gift className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">
                      Activez AlgoPronos AI - 100% Gratuit
                    </h3>
                    <Badge variant="success">Gratuit</Badge>
                  </div>
                  <p className="text-text-secondary max-w-xl">
                    Créez un compte 1xBet avec notre code promo pour débloquer 2 coupons IA par jour + bonus jusqu&apos;à 208,000 FCFA
                  </p>
                </div>
              </div>
              <Button variant="gradient" size="lg" asChild>
                <Link href="/unlock-vip">
                  Activer Gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Usage (for verified users) */}
      {isVerified && (
        <Card className="bg-gradient-to-br from-success/10 to-primary/10 border-success/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Coupons du jour</h3>
                  <p className="text-text-secondary">
                    {2 - (user.daily_coupon_count || 0)} coupon(s) restant(s) aujourd&apos;hui
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {user.daily_coupon_count || 0}/2
                  </div>
                  <div className="text-xs text-text-muted">utilisés</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Combinés générés</p>
                <p className="text-2xl font-bold text-white">
                  {stats.combinesGenerated}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Taux de réussite</p>
                <p className="text-2xl font-bold text-white">
                  {stats.successRate > 0 ? `${stats.successRate}%` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Gains estimés</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalWinnings > 0 ? `${stats.totalWinnings.toLocaleString()}F` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-text-muted text-sm">Série en cours</p>
                <p className="text-2xl font-bold text-white">
                  {stats.streak > 0 ? `${stats.streak} wins` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Nouveau Combiné</CardTitle>
            <CardDescription>
              Générez un combiné personnalisé avec notre IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild disabled={!isVerified}>
              <Link href="/dashboard/generate">
                Générer maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-2">
              <History className="h-6 w-6 text-secondary" />
            </div>
            <CardTitle>Mes Combinés</CardTitle>
            <CardDescription>
              Consultez vos combinés générés récemment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/combines">
                Voir mes combinés
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
            <CardTitle>Historique</CardTitle>
            <CardDescription>
              Analysez vos performances passées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/history">
                Voir l&apos;historique
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
          <CardDescription>
            Vos dernières générations de combinés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerified && recentCombines.length > 0 ? (
            <div className="space-y-4">
              {recentCombines.map((combine, index) => (
                <div
                  key={combine.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 hover:bg-surface-light transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        Combiné {Array.isArray(combine.matches) ? combine.matches.length : 0} matchs
                      </p>
                      <p className="text-sm text-text-muted">
                        {formatTimeAgo(combine.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-white">
                        Cote: {combine.totalOdds.toFixed(2)}
                      </p>
                      <Badge
                        variant={
                          combine.status === 'won'
                            ? 'success'
                            : combine.status === 'lost'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {combine.status === 'won' && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {combine.status === 'lost' && (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {combine.status === 'won'
                          ? 'Gagné'
                          : combine.status === 'lost'
                          ? 'Perdu'
                          : 'En cours'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/combines/${combine.id}`}>
                        Voir
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : isVerified ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-text-secondary mb-4">
                Vous n&apos;avez pas encore généré de combinés
              </p>
              <Button variant="gradient" asChild>
                <Link href="/dashboard/generate">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer mon premier combiné
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-text-secondary mb-4">
                Activez votre compte pour générer vos premiers combinés
              </p>
              <Button variant="gradient" asChild>
                <Link href="/unlock-vip">
                  Activer Gratuitement
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Chart */}
      {isVerified && stats.combinesGenerated > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Évolution de vos résultats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Progression</span>
                <span className="text-sm font-medium text-white">
                  {stats.combinesGenerated} combiné{stats.combinesGenerated > 1 ? 's' : ''} généré{stats.combinesGenerated > 1 ? 's' : ''}
                </span>
              </div>
              <Progress value={Math.min(stats.combinesGenerated * 10, 100)} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">
                  Continuez à générer pour améliorer vos stats
                </span>
                {stats.successRate > 0 && (
                  <span className="text-primary font-medium">
                    {stats.successRate}% de réussite
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

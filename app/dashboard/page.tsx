import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  TrendingUp,
  Zap,
  History,
  Crown,
  ArrowRight,
  Trophy,
  Target,
  Calendar,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const isVIP = user?.tier === 'vip_lifetime';
  const isPremium = user?.tier === 'premium';
  const hasAccess = isVIP || isPremium;

  // Mock stats - in real app, fetch from database
  const stats = {
    combinesGenerated: 12,
    successRate: 78,
    totalWinnings: 45000,
    streak: 4,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Tableau de bord
          </h1>
          <p className="text-text-secondary mt-1">
            Générez et suivez vos combinés IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasAccess ? (
            <Button size="lg" variant="gradient" asChild>
              <Link href="/dashboard/generate">
                <Sparkles className="mr-2 h-5 w-5" />
                Générer un Combiné
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="gradient" asChild>
              <Link href="/unlock-vip">
                <Crown className="mr-2 h-5 w-5" />
                Débloquer VIP Gratuit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Access Card (if no tier) */}
      {!hasAccess && (
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Crown className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Débloquez l&apos;accès illimité
                  </h3>
                  <p className="text-text-secondary max-w-xl">
                    Créez un compte 1xBet avec notre code promo et obtenez l&apos;accès
                    VIP gratuit à vie. Ou choisissez Premium à 1000F/semaine.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="gradient" asChild>
                  <Link href="/unlock-vip">
                    VIP Gratuit à Vie
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/premium/checkout">
                    Premium 1000F/sem
                  </Link>
                </Button>
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
                  {stats.successRate}%
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
                  {stats.totalWinnings.toLocaleString()}F
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
                  {stats.streak} wins
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
            <Button className="w-full" asChild disabled={!hasAccess}>
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
          {hasAccess ? (
            <div className="space-y-4">
              {/* Mock recent combines */}
              {[1, 2, 3].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface-light/50 hover:bg-surface-light transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        Combiné #{12 - index} matchs
                      </p>
                      <p className="text-sm text-text-muted">
                        Il y a {index + 1} jour{index > 0 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-white">Cote: {(5.2 + index * 1.3).toFixed(2)}</p>
                      <Badge variant={index === 0 ? 'success' : 'outline'}>
                        {index === 0 ? 'Gagné' : 'En cours'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/combines/${12 - index}`}>
                        Voir
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-text-secondary mb-4">
                Débloquez l&apos;accès pour générer vos premiers combinés
              </p>
              <Button variant="gradient" asChild>
                <Link href="/unlock-vip">
                  Débloquer VIP Gratuit
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>
            Évolution de vos résultats sur les 30 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Objectif mensuel</span>
              <span className="text-sm font-medium text-white">75%</span>
            </div>
            <Progress value={stats.successRate} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">
                {stats.combinesGenerated} combinés générés
              </span>
              <span className="text-primary font-medium">
                {stats.successRate}% de réussite
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

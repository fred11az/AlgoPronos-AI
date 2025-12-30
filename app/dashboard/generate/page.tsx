'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Calendar,
  Trophy,
  Target,
  Zap,
  Brain,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Flame,
} from 'lucide-react';
import toast from 'react-hot-toast';

const leagues = [
  { code: 'PL', name: 'Premier League', country: 'Angleterre' },
  { code: 'LA', name: 'La Liga', country: 'Espagne' },
  { code: 'SA', name: 'Serie A', country: 'Italie' },
  { code: 'BL', name: 'Bundesliga', country: 'Allemagne' },
  { code: 'FL', name: 'Ligue 1', country: 'France' },
  { code: 'CL', name: 'Champions League', country: 'Europe' },
  { code: 'EL', name: 'Europa League', country: 'Europe' },
  { code: 'CAN', name: 'CAN', country: 'Afrique' },
];

const riskLevels = [
  {
    id: 'safe',
    name: 'Prudent',
    description: 'Cotes faibles, haute probabilité',
    icon: Shield,
    color: 'text-success',
  },
  {
    id: 'balanced',
    name: 'Équilibré',
    description: 'Bon ratio risque/gain',
    icon: Target,
    color: 'text-primary',
  },
  {
    id: 'risky',
    name: 'Risqué',
    description: 'Cotes élevées, gains potentiels importants',
    icon: Flame,
    color: 'text-warning',
  },
];

export default function GeneratePage() {
  const router = useRouter();

  // Form state
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['PL', 'LA']);
  const [oddsRange, setOddsRange] = useState([3, 10]);
  const [matchCount, setMatchCount] = useState(3);
  const [riskLevel, setRiskLevel] = useState('balanced');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string>('');

  const toggleLeague = (code: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  async function handleGenerate() {
    if (selectedLeagues.length === 0) {
      toast.error('Sélectionnez au moins un championnat');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      // Simulate progress steps
      const steps = [
        { text: 'Analyse des matchs disponibles...', progress: 20 },
        { text: 'Collecte des statistiques...', progress: 40 },
        { text: 'Consultation de l\'IA Claude...', progress: 60 },
        { text: 'Génération des analyses...', progress: 80 },
        { text: 'Finalisation du combiné...', progress: 95 },
      ];

      for (const s of steps) {
        setStep(s.text);
        setProgress(s.progress);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Make API call
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: {
            date: new Date().toISOString(),
            leagues: selectedLeagues,
            oddsRange: { min: oddsRange[0], max: oddsRange[1] },
            matchCount,
            riskLevel,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur de génération');
      }

      const { combine } = await response.json();

      setProgress(100);
      setStep('Combiné généré avec succès !');

      toast.success('Combiné généré avec succès !');

      // Redirect to combine view
      setTimeout(() => {
        router.push(`/dashboard/combines/${combine.id}`);
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de génération');
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* AI Animation */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse opacity-50"></div>
                <div className="absolute inset-2 bg-surface rounded-full flex items-center justify-center">
                  <Brain className="h-10 w-10 text-primary animate-bounce" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Génération en cours
                </h2>
                <p className="text-text-secondary">{step}</p>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-text-muted">{progress}%</p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Claude Sonnet 4.5 analyse les matchs...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Générer un Combiné
        </h1>
        <p className="text-text-secondary mt-1">
          Configurez vos paramètres et laissez l&apos;IA créer votre combiné optimal
        </p>
      </div>

      {/* Configuration Cards */}
      <div className="grid gap-6">
        {/* Leagues Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Championnats
            </CardTitle>
            <CardDescription>
              Sélectionnez les ligues à inclure dans votre combiné
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {leagues.map((league) => (
                <button
                  key={league.code}
                  onClick={() => toggleLeague(league.code)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedLeagues.includes(league.code)
                      ? 'border-primary bg-primary/10'
                      : 'border-surface-light hover:border-primary/50'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-white">{league.name}</p>
                    <p className="text-xs text-text-muted">{league.country}</p>
                  </div>
                  {selectedLeagues.includes(league.code) && (
                    <CheckCircle2 className="h-5 w-5 text-primary mt-2" />
                  )}
                </button>
              ))}
            </div>
            {selectedLeagues.length === 0 && (
              <div className="flex items-center gap-2 mt-4 text-warning text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Sélectionnez au moins un championnat</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Odds Range */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Fourchette de Cotes
            </CardTitle>
            <CardDescription>
              Définissez la cote totale souhaitée pour votre combiné
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Slider
                value={oddsRange}
                onValueChange={setOddsRange}
                min={1.5}
                max={50}
                step={0.5}
                className="w-full"
              />
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{oddsRange[0]}</p>
                  <p className="text-sm text-text-muted">Minimum</p>
                </div>
                <div className="flex-1 px-4">
                  <div className="h-px bg-gradient-to-r from-primary to-secondary"></div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{oddsRange[1]}</p>
                  <p className="text-sm text-text-muted">Maximum</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Count */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Nombre de Matchs
            </CardTitle>
            <CardDescription>
              Combien de matchs voulez-vous dans votre combiné ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {[2, 3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  onClick={() => setMatchCount(count)}
                  className={`w-14 h-14 rounded-xl font-bold text-lg transition-all ${
                    matchCount === count
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'bg-surface-light text-text-secondary hover:text-white'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Niveau de Risque
            </CardTitle>
            <CardDescription>
              Choisissez votre stratégie de paris
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {riskLevels.map((level) => {
                const Icon = level.icon;
                return (
                  <button
                    key={level.id}
                    onClick={() => setRiskLevel(level.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      riskLevel === level.id
                        ? 'border-primary bg-primary/10'
                        : 'border-surface-light hover:border-primary/50'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${level.color} mb-2`} />
                    <p className="font-medium text-white">{level.name}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {level.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary & Generate */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Récapitulatif
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {selectedLeagues.length} championnat{selectedLeagues.length > 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline">
                  Cotes {oddsRange[0]} - {oddsRange[1]}
                </Badge>
                <Badge variant="outline">{matchCount} matchs</Badge>
                <Badge variant="outline" className="capitalize">
                  {riskLevel === 'safe'
                    ? 'Prudent'
                    : riskLevel === 'balanced'
                    ? 'Équilibré'
                    : 'Risqué'}
                </Badge>
              </div>
            </div>
            <Button
              size="xl"
              variant="gradient"
              onClick={handleGenerate}
              disabled={selectedLeagues.length === 0}
              className="w-full md:w-auto"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Générer mon Combiné
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

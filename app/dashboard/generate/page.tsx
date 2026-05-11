'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sparkles,
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
  Calendar,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FootballMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  league: string;
  leagueCode: string;
  country: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'finished';
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

const leagueCategories = [
  {
    name: 'Europe - Top 5',
    leagues: [
      { code: 'PL', name: 'Premier League', country: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { code: 'LA', name: 'La Liga', country: 'Espagne', flag: '🇪🇸' },
      { code: 'SA', name: 'Serie A', country: 'Italie', flag: '🇮🇹' },
      { code: 'BL', name: 'Bundesliga', country: 'Allemagne', flag: '🇩🇪' },
      { code: 'FL', name: 'Ligue 1', country: 'France', flag: '🇫🇷' },
    ],
  },
  {
    name: 'Compétitions Européennes',
    leagues: [
      { code: 'CL', name: 'Champions League', country: 'Europe', flag: '🏆' },
      { code: 'EL', name: 'Europa League', country: 'Europe', flag: '🏆' },
      { code: 'ECL', name: 'Conference League', country: 'Europe', flag: '🏆' },
    ],
  },
  {
    name: 'Afrique',
    leagues: [
      { code: 'CAN', name: 'CAN', country: 'Afrique', flag: '🌍' },
      { code: 'CAF_CL', name: 'Ligue des Champions CAF', country: 'Afrique', flag: '🌍' },
      { code: 'CAF_CC', name: 'Coupe de la Confédération', country: 'Afrique', flag: '🌍' },
      { code: 'BJ1', name: 'Ligue Pro Bénin', country: 'Bénin', flag: '🇧🇯' },
      { code: 'CI1', name: 'Ligue 1 Ivoirienne', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
      { code: 'SN1', name: 'Ligue 1 Sénégalaise', country: 'Sénégal', flag: '🇸🇳' },
      { code: 'CM1', name: 'Elite One Cameroun', country: 'Cameroun', flag: '🇨🇲' },
      { code: 'NG1', name: 'NPFL Nigeria', country: 'Nigeria', flag: '🇳🇬' },
      { code: 'GH1', name: 'GPL Ghana', country: 'Ghana', flag: '🇬🇭' },
      { code: 'EG1', name: 'Egyptian Premier', country: 'Égypte', flag: '🇪🇬' },
      { code: 'MA1', name: 'Botola Pro Maroc', country: 'Maroc', flag: '🇲🇦' },
      { code: 'TN1', name: 'Ligue 1 Tunisie', country: 'Tunisie', flag: '🇹🇳' },
      { code: 'DZ1', name: 'Ligue 1 Algérie', country: 'Algérie', flag: '🇩🇿' },
    ],
  },
  {
    name: 'Autres Europe',
    leagues: [
      { code: 'PT1', name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹' },
      { code: 'NL1', name: 'Eredivisie', country: 'Pays-Bas', flag: '🇳🇱' },
      { code: 'BE1', name: 'Pro League', country: 'Belgique', flag: '🇧🇪' },
      { code: 'TR1', name: 'Süper Lig', country: 'Turquie', flag: '🇹🇷' },
      { code: 'RU1', name: 'Premier League', country: 'Russie', flag: '🇷🇺' },
      { code: 'GR1', name: 'Super League', country: 'Grèce', flag: '🇬🇷' },
      { code: 'CH1', name: 'Super League', country: 'Suisse', flag: '🇨🇭' },
      { code: 'AT1', name: 'Bundesliga', country: 'Autriche', flag: '🇦🇹' },
      { code: 'SC1', name: 'Premiership', country: 'Écosse', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
    ],
  },
  {
    name: 'Amériques',
    leagues: [
      { code: 'BR1', name: 'Brasileirão', country: 'Brésil', flag: '🇧🇷' },
      { code: 'AR1', name: 'Liga Profesional', country: 'Argentine', flag: '🇦🇷' },
      { code: 'MX1', name: 'Liga MX', country: 'Mexique', flag: '🇲🇽' },
      { code: 'US1', name: 'MLS', country: 'USA', flag: '🇺🇸' },
      { code: 'COPA', name: 'Copa Libertadores', country: 'Amérique du Sud', flag: '🏆' },
    ],
  },
  {
    name: 'Asie & Océanie',
    leagues: [
      { code: 'JP1', name: 'J-League', country: 'Japon', flag: '🇯🇵' },
      { code: 'KR1', name: 'K-League', country: 'Corée du Sud', flag: '🇰🇷' },
      { code: 'CN1', name: 'Super League', country: 'Chine', flag: '🇨🇳' },
      { code: 'AU1', name: 'A-League', country: 'Australie', flag: '🇦🇺' },
      { code: 'SA1', name: 'Saudi Pro League', country: 'Arabie Saoudite', flag: '🇸🇦' },
      { code: 'AFC_CL', name: 'AFC Champions League', country: 'Asie', flag: '🏆' },
    ],
  },
];

const riskLevels = [
  {
    id: 'safe',
    name: 'Prudent',
    description: 'Cotes 1.2-2.0, haute probabilité',
    icon: Shield,
    color: 'text-success',
    oddsRange: [1.2, 2.0],
  },
  {
    id: 'balanced',
    name: 'Équilibré',
    description: 'Cotes 2.0-4.0, bon ratio',
    icon: Target,
    color: 'text-primary',
    oddsRange: [2.0, 4.0],
  },
  {
    id: 'risky',
    name: 'Risqué',
    description: 'Cotes 4.0+, gros gains',
    icon: Flame,
    color: 'text-warning',
    oddsRange: [4.0, 20.0],
  },
];

const betTypes = [
  { id: 'single', name: 'Simple', description: '1 match', matchCount: 1 },
  { id: 'double', name: 'Double', description: '2 matchs', matchCount: 2 },
  { id: 'triple', name: 'Triple', description: '3 matchs', matchCount: 3 },
  { id: 'accumulator', name: 'Combiné 4+', description: '4 à 10 matchs', matchCount: 4 },
];

type Step = 'config' | 'leagues' | 'matches' | 'generate';

const STEP_LABELS: Record<Step, string> = {
  config: 'Config',
  leagues: 'Ligues',
  matches: 'Matchs',
  generate: 'Génération',
};
const STEP_ORDER: Step[] = ['config', 'leagues', 'matches'];

export default function GeneratePage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<Step>('config');
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['PL', 'LA', 'CL']);
  const [betType, setBetType] = useState('triple');
  const [matchCount, setMatchCount] = useState(3);
  const [riskLevel, setRiskLevel] = useState('balanced');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [availableMatches, setAvailableMatches] = useState<FootballMatch[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>([]);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string>('');

  const fetchMatches = useCallback(async () => {
    if (selectedLeagues.length === 0) { setAvailableMatches([]); return; }
    setLoadingMatches(true);
    try {
      const response = await fetch(`/api/matches?date=${selectedDate}&leagues=${selectedLeagues.join(',')}`);
      const data = await response.json();
      if (data.matches) {
        setAvailableMatches(data.matches);
        const uniqueLeagues = Array.from(new Set(data.matches.map((m: FootballMatch) => m.leagueCode))) as string[];
        setExpandedLeagues(uniqueLeagues);
      }
    } catch {
      toast.error('Erreur lors du chargement des matchs');
    } finally {
      setLoadingMatches(false);
    }
  }, [selectedDate, selectedLeagues]);

  useEffect(() => {
    if (currentStep === 'matches') fetchMatches();
  }, [currentStep, fetchMatches]);

  const toggleLeague = (code: string) =>
    setSelectedLeagues((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);

  const selectAllInCategory = (categoryLeagues: { code: string }[]) => {
    const codes = categoryLeagues.map((l) => l.code);
    const allSelected = codes.every((c) => selectedLeagues.includes(c));
    setSelectedLeagues((prev) => allSelected ? prev.filter((c) => !codes.includes(c)) : Array.from(new Set([...prev, ...codes])));
  };

  const handleBetTypeChange = (type: string) => {
    setBetType(type);
    const betConfig = betTypes.find((b) => b.id === type);
    if (betConfig) setMatchCount(betConfig.matchCount);
  };

  const toggleMatch = (matchId: string) =>
    setSelectedMatches((prev) => prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]);

  const toggleLeagueExpand = (leagueCode: string) =>
    setExpandedLeagues((prev) => prev.includes(leagueCode) ? prev.filter((c) => c !== leagueCode) : [...prev, leagueCode]);

  const matchesByLeague = availableMatches.reduce((acc, match) => {
    if (!acc[match.leagueCode]) acc[match.leagueCode] = { name: match.league, country: match.country, matches: [] };
    acc[match.leagueCode].matches.push(match);
    return acc;
  }, {} as Record<string, { name: string; country: string; matches: FootballMatch[] }>);

  const getLeagueInfo = (code: string) => {
    for (const cat of leagueCategories) {
      const league = cat.leagues.find((l) => l.code === code);
      if (league) return league;
    }
    return null;
  };

  const filteredCategories = leagueCategories
    .map((cat) => ({
      ...cat,
      leagues: cat.leagues.filter(
        (l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.country.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.leagues.length > 0);

  const canProceedToMatches = selectedLeagues.length > 0;
  const canGenerate = betType === 'single' ? selectedMatches.length >= 1 : selectedMatches.length >= matchCount;

  async function handleGenerate() {
    if (!canGenerate) {
      toast.error(`Sélectionnez au moins ${matchCount} match${matchCount > 1 ? 's' : ''}`);
      return;
    }
    setCurrentStep('generate');
    setGenerating(true);
    setProgress(0);
    try {
      const steps = [
        { text: 'Analyse des équipes sélectionnées...', progress: 15 },
        { text: 'Étude des statistiques récentes...', progress: 30 },
        { text: 'Analyse des confrontations directes...', progress: 45 },
        { text: 'AlgoPronos AI en cours d\'analyse...', progress: 60 },
        { text: 'Calcul des probabilités...', progress: 75 },
        { text: 'Génération des pronostics...', progress: 90 },
        { text: 'Finalisation...', progress: 98 },
      ];
      for (const s of steps) {
        setStep(s.text);
        setProgress(s.progress);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      const riskConfig = riskLevels.find((r) => r.id === riskLevel);
      const selectedMatchDetails = availableMatches.filter((m) => selectedMatches.includes(m.id));
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: {
            date: selectedDate,
            leagues: selectedLeagues,
            oddsRange: { min: riskConfig?.oddsRange[0] || 2, max: riskConfig?.oddsRange[1] || 4 },
            matchCount: selectedMatches.length,
            riskLevel,
            betType,
            selectedMatches: selectedMatchDetails,
          },
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.diagnostic ? `${data.error} (${data.diagnostic})` : (data.error || 'Erreur de génération'));
      }
      const { combine } = await response.json();
      setProgress(100);
      setStep('Pronostic généré avec succès !');
      toast.success(betType === 'single' ? 'Analyse générée !' : 'Combiné généré !');
      setTimeout(() => router.push(`/dashboard/combines/${combine.id}`), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de génération');
      setGenerating(false);
      setCurrentStep('matches');
    }
  }

  // ── Generating screen ──────────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="max-w-lg mx-auto px-4">
        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center space-y-5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse opacity-50" />
                <div className="absolute inset-2 bg-surface rounded-full flex items-center justify-center">
                  <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-bounce" />
                </div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {betType === 'single' ? 'Analyse en cours' : 'Génération du combiné'}
                </h2>
                <p className="text-text-secondary text-sm sm:text-base">{step}</p>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-text-muted">{progress}%</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AlgoPronos AI analyse {selectedMatches.length} match{selectedMatches.length > 1 ? 's' : ''}...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Step indicator (mobile: pill compact / desktop: full labels) ───────────
  const currentStepIndex = STEP_ORDER.indexOf(currentStep as any);

  const StepIndicator = () => (
    <>
      {/* Mobile: compact pill */}
      <div className="flex md:hidden items-center gap-2 mt-1">
        <div className="flex gap-1">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i <= currentStepIndex ? 'bg-primary w-6' : 'bg-surface-light w-3'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-text-muted">
          Étape {currentStepIndex + 1}/{STEP_ORDER.length} — {STEP_LABELS[currentStep]}
        </span>
      </div>

      {/* Desktop: full pills */}
      <div className="hidden md:flex items-center gap-2">
        {STEP_ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              currentStep === s ? 'bg-primary text-white' : 'bg-surface-light text-text-muted'
            }`}>
              <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">{i + 1}</span>
              <span className="text-sm">{STEP_LABELS[s]}</span>
            </div>
            {i < STEP_ORDER.length - 1 && <ChevronDown className="h-4 w-4 text-text-muted rotate-[-90deg]" />}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-0 sm:px-0">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
            Générer un Pronostic
          </h1>
          <p className="text-text-secondary text-sm mt-0.5 hidden sm:block">
            Pari simple ou combiné — sélectionnez vos matchs
          </p>
          <StepIndicator />
        </div>
      </div>

      {/* ── Step 1: Config ─────────────────────────────────────────────────── */}
      {currentStep === 'config' && (
        <>
          {/* Bet Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Zap className="h-5 w-5 text-primary shrink-0" />
                Type de Pari
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Pari simple ou combiné
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {betTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleBetTypeChange(type.id)}
                    className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                      betType === type.id
                        ? 'border-primary bg-primary/10'
                        : 'border-surface-light hover:border-primary/50'
                    }`}
                  >
                    <p className="font-bold text-white text-sm sm:text-base">{type.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{type.description}</p>
                    {betType === type.id && <CheckCircle2 className="h-4 w-4 text-primary mt-2" />}
                  </button>
                ))}
              </div>

              {betType === 'accumulator' && (
                <div className="mt-5">
                  <p className="text-sm text-text-secondary mb-3">Nombre de matchs minimum :</p>
                  <div className="flex flex-wrap gap-2">
                    {[4, 5, 6, 7, 8, 9, 10].map((count) => (
                      <button
                        key={count}
                        onClick={() => setMatchCount(count)}
                        className={`w-11 h-11 rounded-xl font-bold text-sm transition-all ${
                          matchCount === count
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-surface-light text-text-secondary hover:text-white'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                Date des Matchs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:max-w-xs"
                />
                <div className="flex gap-2">
                  <Button
                    variant={selectedDate === new Date().toISOString().split('T')[0] ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  >
                    Aujourd&apos;hui
                  </Button>
                  <Button
                    variant={selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => setSelectedDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])}
                  >
                    Demain
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Level */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-5 w-5 text-primary shrink-0" />
                Niveau de Risque
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Définit la fourchette de cotes recommandées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <div className="flex items-center gap-3 sm:block">
                        <Icon className={`h-6 w-6 ${level.color} sm:mb-2 shrink-0`} />
                        <div>
                          <p className="font-medium text-white">{level.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">{level.description}</p>
                        </div>
                        {riskLevel === level.id && <CheckCircle2 className="h-5 w-5 text-primary ml-auto sm:hidden" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            variant="gradient"
            className="w-full sm:w-auto sm:self-end"
            onClick={() => setCurrentStep('leagues')}
          >
            Suivant : Championnats
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </>
      )}

      {/* ── Step 2: Leagues ────────────────────────────────────────────────── */}
      {currentStep === 'leagues' && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Trophy className="h-5 w-5 text-primary shrink-0" />
                    Championnats
                    <Badge variant="outline" className="text-xs ml-1">{selectedLeagues.length}</Badge>
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  Sélectionnez les ligues pour voir les matchs disponibles
                </CardDescription>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    placeholder="Rechercher un championnat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Europe - Top 5" className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-1.5 bg-transparent mb-1">
                  {filteredCategories.map((cat) => (
                    <TabsTrigger
                      key={cat.name}
                      value={cat.name}
                      className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      {cat.name.replace('Europe - ', '').replace('Autres ', '').replace('Compétitions ', '')}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {filteredCategories.map((cat) => (
                  <TabsContent key={cat.name} value={cat.name} className="mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => selectAllInCategory(cat.leagues)}
                      >
                        {cat.leagues.every((l) => selectedLeagues.includes(l.code))
                          ? 'Tout désélectionner'
                          : 'Tout sélectionner'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {cat.leagues.map((league) => (
                        <button
                          key={league.code}
                          onClick={() => toggleLeague(league.code)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            selectedLeagues.includes(league.code)
                              ? 'border-primary bg-primary/10'
                              : 'border-surface-light hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl shrink-0">{league.flag}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-white text-sm truncate">{league.name}</p>
                              <p className="text-xs text-text-muted truncate">{league.country}</p>
                            </div>
                            {selectedLeagues.includes(league.code) && (
                              <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {selectedLeagues.length === 0 && (
                <div className="flex items-center gap-2 mt-4 text-warning text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Sélectionnez au moins un championnat</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={() => setCurrentStep('config')}
            >
              Retour
            </Button>
            <Button
              size="lg"
              variant="gradient"
              className="flex-1 sm:flex-none"
              onClick={() => setCurrentStep('matches')}
              disabled={!canProceedToMatches}
            >
              Suivant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {/* ── Step 3: Match Selection ─────────────────────────────────────────── */}
      {currentStep === 'matches' && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Target className="h-5 w-5 text-primary shrink-0" />
                    Sélection des Matchs
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {selectedMatches.length}/{matchCount} sélectionné{selectedMatches.length > 1 ? 's' : ''}
                    {betType !== 'single' && ` (min. ${matchCount})`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                    {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMatches}
                    disabled={loadingMatches}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingMatches ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMatches ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-text-muted text-sm">Chargement des matchs...</span>
                </div>
              ) : availableMatches.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-10 w-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted font-medium">Aucun match trouvé</p>
                  <p className="text-xs text-text-muted mt-1">
                    Essayez d&apos;autres championnats ou une autre date
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(matchesByLeague).map(([leagueCode, leagueData]) => {
                    const leagueInfo = getLeagueInfo(leagueCode);
                    const isExpanded = expandedLeagues.includes(leagueCode);
                    const selectedInLeague = leagueData.matches.filter((m) => selectedMatches.includes(m.id)).length;

                    return (
                      <div key={leagueCode} className="border border-surface-light rounded-xl overflow-hidden">
                        {/* League header */}
                        <button
                          onClick={() => toggleLeagueExpand(leagueCode)}
                          className="w-full flex items-center justify-between p-3 sm:p-4 bg-surface-light/50 hover:bg-surface-light transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{leagueInfo?.flag || '⚽'}</span>
                            <div className="text-left">
                              <p className="font-medium text-white text-sm">{leagueData.name}</p>
                              <p className="text-xs text-text-muted">
                                {leagueData.matches.length} match{leagueData.matches.length > 1 ? 's' : ''}
                                {selectedInLeague > 0 && (
                                  <span className="text-primary ml-1.5">· {selectedInLeague} sél.</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
                            : <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                          }
                        </button>

                        {/* Match rows */}
                        {isExpanded && (
                          <div className="divide-y divide-surface-light">
                            {leagueData.matches.map((match) => {
                              const isSelected = selectedMatches.includes(match.id);
                              return (
                                <div
                                  key={match.id}
                                  onClick={() => toggleMatch(match.id)}
                                  className={`p-3 sm:p-4 cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-primary/10 border-l-4 border-primary'
                                      : 'hover:bg-surface-light/30'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleMatch(match.id)}
                                      className="data-[state=checked]:bg-primary mt-0.5 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      {/* Time + teams */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-text-muted font-medium shrink-0 flex items-center gap-1">
                                          <Clock className="h-3 w-3" />{match.time}
                                        </span>
                                      </div>
                                      <p className="text-white font-medium text-sm leading-tight">
                                        <span className="truncate block sm:inline">{match.homeTeam}</span>
                                        <span className="text-text-muted mx-1.5 hidden sm:inline">vs</span>
                                        <span className="text-text-muted text-xs sm:hidden block">vs</span>
                                        <span className="truncate block sm:inline">{match.awayTeam}</span>
                                      </p>
                                      {/* Odds — visible on all screens below team names */}
                                      {match.odds && (
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                          <span className="px-1.5 py-0.5 rounded bg-surface-light text-text-secondary text-xs">
                                            1: {match.odds.home}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded bg-surface-light text-text-secondary text-xs">
                                            X: {match.odds.draw}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded bg-surface-light text-text-secondary text-xs">
                                            2: {match.odds.away}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected summary */}
          {selectedMatches.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary mb-1.5">
                      {selectedMatches.length} match{selectedMatches.length > 1 ? 's' : ''} sélectionné{selectedMatches.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMatches.map((matchId) => {
                        const match = availableMatches.find((m) => m.id === matchId);
                        if (!match) return null;
                        return (
                          <Badge key={matchId} variant="outline" className="text-xs max-w-[180px] truncate">
                            {match.homeTeam} vs {match.awayTeam}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMatches([])}
                    className="text-error hover:text-error shrink-0 text-xs h-7 px-2"
                  >
                    Effacer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nav buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={() => setCurrentStep('leagues')}
            >
              Retour
            </Button>
            <Button
              size="lg"
              variant="gradient"
              className="flex-1 sm:flex-none"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              <span className="sm:hidden">
                {betType === 'single' ? 'Analyser' : 'Générer'}
              </span>
              <span className="hidden sm:inline">
                {betType === 'single' ? 'Analyser ce Match' : 'Générer mon Combiné'}
              </span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

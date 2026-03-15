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

// Extended leagues list with categories
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
    description: 'Cotes faibles (1.2-2.0), haute probabilité',
    icon: Shield,
    color: 'text-success',
    oddsRange: [1.2, 2.0],
  },
  {
    id: 'balanced',
    name: 'Équilibré',
    description: 'Cotes moyennes (2.0-4.0), bon ratio',
    icon: Target,
    color: 'text-primary',
    oddsRange: [2.0, 4.0],
  },
  {
    id: 'risky',
    name: 'Risqué',
    description: 'Cotes élevées (4.0+), gros gains potentiels',
    icon: Flame,
    color: 'text-warning',
    oddsRange: [4.0, 20.0],
  },
];

const betTypes = [
  { id: 'single', name: 'Pari Simple', description: '1 match analysé', matchCount: 1 },
  { id: 'double', name: 'Double', description: '2 matchs combinés', matchCount: 2 },
  { id: 'triple', name: 'Triple', description: '3 matchs combinés', matchCount: 3 },
  { id: 'accumulator', name: 'Combiné 4+', description: '4 à 10 matchs', matchCount: 4 },
];

// Step components for wizard-like flow
type Step = 'config' | 'leagues' | 'matches' | 'generate';

export default function GeneratePage() {
  const router = useRouter();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('config');

  // Form state
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['PL', 'LA', 'CL']);
  const [betType, setBetType] = useState('triple');
  const [matchCount, setMatchCount] = useState(3);
  const [riskLevel, setRiskLevel] = useState('balanced');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Match selection state
  const [availableMatches, setAvailableMatches] = useState<FootballMatch[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>([]);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string>('');

  // Fetch matches when leagues or date change
  const fetchMatches = useCallback(async () => {
    if (selectedLeagues.length === 0) {
      setAvailableMatches([]);
      return;
    }

    setLoadingMatches(true);
    try {
      const response = await fetch(
        `/api/matches?date=${selectedDate}&leagues=${selectedLeagues.join(',')}`
      );
      const data = await response.json();

      if (data.matches) {
        setAvailableMatches(data.matches);
        // Expand all leagues by default
        const uniqueLeagues = Array.from(new Set(data.matches.map((m: FootballMatch) => m.leagueCode))) as string[];
        setExpandedLeagues(uniqueLeagues);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Erreur lors du chargement des matchs');
    } finally {
      setLoadingMatches(false);
    }
  }, [selectedDate, selectedLeagues]);

  // Fetch matches when going to matches step
  useEffect(() => {
    if (currentStep === 'matches') {
      fetchMatches();
    }
  }, [currentStep, fetchMatches]);

  const toggleLeague = (code: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectAllInCategory = (categoryLeagues: { code: string }[]) => {
    const codes = categoryLeagues.map((l) => l.code);
    const allSelected = codes.every((c) => selectedLeagues.includes(c));

    if (allSelected) {
      setSelectedLeagues((prev) => prev.filter((c) => !codes.includes(c)));
    } else {
      setSelectedLeagues((prev) => Array.from(new Set([...prev, ...codes])));
    }
  };

  const handleBetTypeChange = (type: string) => {
    setBetType(type);
    const betConfig = betTypes.find((b) => b.id === type);
    if (betConfig) {
      setMatchCount(betConfig.matchCount);
    }
  };

  const toggleMatch = (matchId: string) => {
    setSelectedMatches((prev) =>
      prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]
    );
  };

  const toggleLeagueExpand = (leagueCode: string) => {
    setExpandedLeagues((prev) =>
      prev.includes(leagueCode)
        ? prev.filter((c) => c !== leagueCode)
        : [...prev, leagueCode]
    );
  };

  // Group matches by league
  const matchesByLeague = availableMatches.reduce((acc, match) => {
    if (!acc[match.leagueCode]) {
      acc[match.leagueCode] = {
        name: match.league,
        country: match.country,
        matches: [],
      };
    }
    acc[match.leagueCode].matches.push(match);
    return acc;
  }, {} as Record<string, { name: string; country: string; matches: FootballMatch[] }>);

  // Get league info helper
  const getLeagueInfo = (code: string) => {
    for (const cat of leagueCategories) {
      const league = cat.leagues.find((l) => l.code === code);
      if (league) return league;
    }
    return null;
  };

  // Filter leagues by search
  const filteredCategories = leagueCategories.map((cat) => ({
    ...cat,
    leagues: cat.leagues.filter(
      (l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.country.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.leagues.length > 0);

  const canProceedToMatches = selectedLeagues.length > 0;
  const canGenerate = betType === 'single'
    ? selectedMatches.length >= 1
    : selectedMatches.length >= matchCount;

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
        { text: 'AlgoPronos AI en cours d\'analyse pour vous...', progress: 60 },
        { text: 'Calcul des probabilités...', progress: 75 },
        { text: 'Génération des pronostics détaillés...', progress: 90 },
        { text: 'Finalisation...', progress: 98 },
      ];

      for (const s of steps) {
        setStep(s.text);
        setProgress(s.progress);
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      // Get risk level config
      const riskConfig = riskLevels.find((r) => r.id === riskLevel);

      // Get selected match details
      const selectedMatchDetails = availableMatches.filter((m) =>
        selectedMatches.includes(m.id)
      );

      // Make API call
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
        const errorMessage = data.diagnostic 
          ? `${data.error} (${data.diagnostic} - Code: ${data.code})`
          : (data.error || 'Erreur de génération');
        throw new Error(errorMessage);
      }

      const { combine } = await response.json();

      setProgress(100);
      setStep('Pronostic généré avec succès !');

      toast.success(betType === 'single' ? 'Analyse générée !' : 'Combiné généré avec succès !');

      setTimeout(() => {
        router.push(`/dashboard/combines/${combine.id}`);
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur de génération');
      setGenerating(false);
      setCurrentStep('matches');
    }
  }

  // Generating screen
  if (generating) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse opacity-50"></div>
                <div className="absolute inset-2 bg-surface rounded-full flex items-center justify-center">
                  <Brain className="h-10 w-10 text-primary animate-bounce" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {betType === 'single' ? 'Analyse en cours' : 'Génération du combiné'}
                </h2>
                <p className="text-text-secondary">{step}</p>
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Générer un Pronostic
          </h1>
          <p className="text-text-secondary mt-1">
            Pari simple ou combiné - sélectionnez vos matchs
          </p>
        </div>

        {/* Step indicator */}
        <div className="hidden md:flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentStep === 'config' ? 'bg-primary text-white' : 'bg-surface-light text-text-muted'}`}>
            <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">1</span>
            <span className="text-sm">Config</span>
          </div>
          <ChevronDown className="h-4 w-4 text-text-muted rotate-[-90deg]" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentStep === 'leagues' ? 'bg-primary text-white' : 'bg-surface-light text-text-muted'}`}>
            <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">2</span>
            <span className="text-sm">Ligues</span>
          </div>
          <ChevronDown className="h-4 w-4 text-text-muted rotate-[-90deg]" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentStep === 'matches' ? 'bg-primary text-white' : 'bg-surface-light text-text-muted'}`}>
            <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">3</span>
            <span className="text-sm">Matchs</span>
          </div>
        </div>
      </div>

      {/* Step 1: Config (Bet Type, Date, Risk) */}
      {currentStep === 'config' && (
        <>
          {/* Bet Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Type de Pari
              </CardTitle>
              <CardDescription>
                Choisissez entre un pari simple ou un combiné
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {betTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleBetTypeChange(type.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      betType === type.id
                        ? 'border-primary bg-primary/10'
                        : 'border-surface-light hover:border-primary/50'
                    }`}
                  >
                    <p className="font-bold text-white">{type.name}</p>
                    <p className="text-xs text-text-muted mt-1">{type.description}</p>
                    {betType === type.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary mt-2" />
                    )}
                  </button>
                ))}
              </div>

              {/* Match count for accumulator */}
              {betType === 'accumulator' && (
                <div className="mt-6">
                  <p className="text-sm text-text-secondary mb-3">Nombre de matchs minimum :</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {[4, 5, 6, 7, 8, 9, 10].map((count) => (
                      <button
                        key={count}
                        onClick={() => setMatchCount(count)}
                        className={`w-12 h-12 rounded-xl font-bold transition-all ${
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

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Date des Matchs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="max-w-xs"
                />
                <div className="flex gap-2">
                  <Button
                    variant={selectedDate === new Date().toISOString().split('T')[0] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  >
                    Aujourd&apos;hui
                  </Button>
                  <Button
                    variant={selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'default' : 'outline'}
                    size="sm"
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Niveau de Risque
              </CardTitle>
              <CardDescription>
                Définit la fourchette de cotes recommandées
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
                      <p className="text-xs text-text-muted mt-1">{level.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Next Step Button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              variant="gradient"
              onClick={() => setCurrentStep('leagues')}
            >
              Suivant : Championnats
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {/* Step 2: Leagues Selection */}
      {currentStep === 'leagues' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Championnats ({selectedLeagues.length} sélectionnés)
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez les ligues pour voir les matchs disponibles
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Europe - Top 5" className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
                  {filteredCategories.map((cat) => (
                    <TabsTrigger
                      key={cat.name}
                      value={cat.name}
                      className="data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {filteredCategories.map((cat) => (
                  <TabsContent key={cat.name} value={cat.name} className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectAllInCategory(cat.leagues)}
                      >
                        {cat.leagues.every((l) => selectedLeagues.includes(l.code))
                          ? 'Tout désélectionner'
                          : 'Tout sélectionner'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {cat.leagues.map((league) => (
                        <button
                          key={league.code}
                          onClick={() => toggleLeague(league.code)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedLeagues.includes(league.code)
                              ? 'border-primary bg-primary/10'
                              : 'border-surface-light hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{league.flag}</span>
                            <div className="text-left">
                              <p className="font-medium text-white text-sm">{league.name}</p>
                              <p className="text-xs text-text-muted">{league.country}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {selectedLeagues.length === 0 && (
                <div className="flex items-center gap-2 mt-4 text-warning text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Sélectionnez au moins un championnat</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep('config')}
            >
              Retour
            </Button>
            <Button
              size="lg"
              variant="gradient"
              onClick={() => setCurrentStep('matches')}
              disabled={!canProceedToMatches}
            >
              Suivant : Sélection des Matchs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Match Selection */}
      {currentStep === 'matches' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Sélection des Matchs
                  </CardTitle>
                  <CardDescription>
                    {selectedMatches.length} / {matchCount} match{matchCount > 1 ? 's' : ''} sélectionné{selectedMatches.length > 1 ? 's' : ''}
                    {betType !== 'single' && ` (minimum ${matchCount})`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMatches}
                    disabled={loadingMatches}
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingMatches ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMatches ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-text-muted">Chargement des matchs...</span>
                </div>
              ) : availableMatches.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">Aucun match trouvé pour cette date</p>
                  <p className="text-sm text-text-muted mt-2">
                    Essayez de sélectionner d&apos;autres championnats ou une autre date
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(matchesByLeague).map(([leagueCode, leagueData]) => {
                    const leagueInfo = getLeagueInfo(leagueCode);
                    const isExpanded = expandedLeagues.includes(leagueCode);
                    const selectedInLeague = leagueData.matches.filter((m) =>
                      selectedMatches.includes(m.id)
                    ).length;

                    return (
                      <div key={leagueCode} className="border border-surface-light rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleLeagueExpand(leagueCode)}
                          className="w-full flex items-center justify-between p-4 bg-surface-light/50 hover:bg-surface-light transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{leagueInfo?.flag || '⚽'}</span>
                            <div className="text-left">
                              <p className="font-medium text-white">{leagueData.name}</p>
                              <p className="text-xs text-text-muted">
                                {leagueData.matches.length} match{leagueData.matches.length > 1 ? 's' : ''}
                                {selectedInLeague > 0 && (
                                  <span className="text-primary ml-2">
                                    ({selectedInLeague} sélectionné{selectedInLeague > 1 ? 's' : ''})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-text-muted" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-text-muted" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-surface-light">
                            {leagueData.matches.map((match) => {
                              const isSelected = selectedMatches.includes(match.id);
                              return (
                                <div
                                  key={match.id}
                                  onClick={() => toggleMatch(match.id)}
                                  className={`p-4 cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-primary/10 border-l-4 border-primary'
                                      : 'hover:bg-surface-light/30'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleMatch(match.id)}
                                        className="data-[state=checked]:bg-primary"
                                      />
                                      <div className="flex items-center gap-2 text-text-muted">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-sm font-medium">{match.time}</span>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-white font-medium">
                                          {match.homeTeam}
                                          <span className="text-text-muted mx-2">vs</span>
                                          {match.awayTeam}
                                        </p>
                                      </div>
                                    </div>
                                    {match.odds && (
                                      <div className="hidden sm:flex items-center gap-2 text-xs">
                                        <span className="px-2 py-1 rounded bg-surface-light text-text-secondary">
                                          1: {match.odds.home}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-surface-light text-text-secondary">
                                          X: {match.odds.draw}
                                        </span>
                                        <span className="px-2 py-1 rounded bg-surface-light text-text-secondary">
                                          2: {match.odds.away}
                                        </span>
                                      </div>
                                    )}
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

          {/* Selected Matches Summary */}
          {selectedMatches.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-text-secondary mb-2">Matchs sélectionnés :</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMatches.map((matchId) => {
                        const match = availableMatches.find((m) => m.id === matchId);
                        if (!match) return null;
                        return (
                          <Badge key={matchId} variant="outline" className="text-xs">
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
                    className="text-error hover:text-error"
                  >
                    Tout effacer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep('leagues')}
            >
              Retour
            </Button>
            <Button
              size="lg"
              variant="gradient"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {betType === 'single' ? 'Analyser ce Match' : 'Générer mon Combiné'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

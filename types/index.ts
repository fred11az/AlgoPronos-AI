// User Types
export type UserTier = 'premium' | 'vip_lifetime';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  country: string;
  tier: UserTier | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

// VIP Verification
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VIPVerification {
  id: string;
  user_id: string;
  bookmaker_identifier: string;
  screenshot_url: string | null;
  status: VerificationStatus;
  admin_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

// Subscription
export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  payment_status: string;
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

// Payment
export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Match & Betting Types
export type RiskLevel = 'safe' | 'balanced' | 'risky';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  leagueCode: string;
  kickoffTime: string;
  venue: string | null;
  homeForm: string[];
  awayForm: string[];
  headToHead: HeadToHead[];
  odds: MatchOdds;
}

export interface HeadToHead {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
  over25: number | null;
  under25: number | null;
  btts: number | null;
  noBtts: number | null;
}

export interface SelectedMatch {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime: string;
  selection: {
    type: string;
    value: string;
    odds: number;
    reasoning: string;
  };
}

export interface MatchAnalysis {
  matchId: string;
  tacticalAnalysis: string;
  formAnalysis: string;
  refereeImpact: string;
  keyPlayers: string;
  prediction: string;
  confidenceLevel: number;
}

export interface CombineAnalysis {
  summary: string;
  keyFactors: string[];
  matchAnalyses: MatchAnalysis[];
  riskAssessment: string;
}

// Generated Combine
export interface GeneratedCombine {
  id: string;
  cache_key: string;
  parameters: CombineParameters;
  matches: SelectedMatch[];
  total_odds: number;
  estimated_probability: number;
  analysis: CombineAnalysis;
  usage_count: number;
  first_generated_by: string;
  expires_at: string;
  created_at: string;
}

export interface CombineParameters {
  date: string | string[];
  leagues: string[];
  oddsRange: {
    min: number;
    max: number;
  };
  matchCount: number;
  riskLevel: RiskLevel;
}

// Combine Usage Log
export interface CombineUsageLog {
  id: string;
  user_id: string;
  combine_id: string;
  usage_type: 'generated' | 'from_cache';
  user_tier: UserTier;
  created_at: string;
}

// Admin Stats
export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  vipUsers: number;
  pendingVerifications: number;
  monthlyRevenue: number;
  combinesGenerated: number;
  signupsChart: ChartData[];
  conversionChart: PieData[];
}

export interface ChartData {
  date: string;
  value: number;
}

export interface PieData {
  name: string;
  value: number;
  color: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface GenerateCombineResponse {
  combine: GeneratedCombine;
  fromCache: boolean;
  apiCost?: string;
}

// Component Props Types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar: string;
}

export interface PricingPlan {
  featured?: boolean;
  badge?: string;
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
}

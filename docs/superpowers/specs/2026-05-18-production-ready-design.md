# AlgoPronos AI — Production-Ready System Design

**Date:** 2026-05-18  
**Status:** Approved  
**Approach:** Core Pipeline First (Approach C)

---

## Goal

Make AlgoPronos AI fully production-ready: automatic daily coupon generation (Classic, Optimus, Montante) using real football API data and AI analysis, no loopholes, no manual intervention, ready for real users in West Africa.

---

## Current State

- Vercel deployment exists but features broken
- All 4 critical APIs active: Venice AI, API-Football v3, The Odds API, Resend
- 1 blocking build error (Badge variant type in grandes-affiches)
- Venice → Groq fallback chain not wired
- Automatic pipeline incomplete/unreliable
- Binary artifacts and sensitive files checked into git

---

## Architecture

### Daily Automatic Pipeline

```
05:00 UTC  →  Vercel Cron: /api/pronostics/generate
               ↓
           API-Football v3
           Fetch today's fixtures (top 8 leagues)
               ↓
           The Odds API
           Attach real bookmaker odds to each fixture
               ↓
           6-Signal Analysis (per match, Venice AI)
           Signal 1: Team Form (last 5 matches)
           Signal 2: Expected Goals (xG)
           Signal 3: Real-time Odds
           Signal 4: Value Betting (expected value)
           Signal 5: Poisson probability
           Signal 6: Risk Adaptation
               ↓
           Match Scoring → ranked list by confidence
               ↓
           Ticket Generation (3 variants)
           Classic:   3-4 selections, confidence >65%, odds 1.5–3.0
           Optimus:   2-3 selections, positive EV, odds >1.8
           Montante:  4-6 selections, progressive stake logic
               ↓
           Store → Supabase daily_ticket table (date, type, matches, odds, analysis)
               ↓
           Push notification → all subscribed users

22:30 UTC  →  Vercel Cron: /api/cron/resolve-tickets
               ↓
           API-Football v3: fetch final scores for yesterday
               ↓
           Resolve each daily_ticket → won/lost/void
               ↓
           Update ai_performance_stats view
```

---

## Phase Plan

### Phase 1 — Build Fix (~30 min)

**Files to fix:**
- `app/grandes-affiches/page.tsx:236` — Change `variant="gradient"` to `variant="default"` (or add gradient to Badge variants)
- `components/ui/badge.tsx` — Add `gradient` variant to satisfy existing usages
- Fix any remaining ESLint errors blocking build
- Rename `lib/services/gemini-service.ts` class from `GeminiService` to `GroqService`

**Files to remove:**
- `lib/services/claude-ai.ts` (unused)
- `lib/services/openclaw-generator.ts` (unused local AI fallback)
- Binary artifacts: `*.bin`, `cookies.txt`, `service-account.json.json`
- Add all of these to `.gitignore`

**Deliverable:** `npm run build` passes with 0 errors.

---

### Phase 2 — Automatic Pipeline (~2-3 hours)

**Core endpoint: `/api/pronostics/generate`**

Rewrite to be fully automatic:

1. **Fixture fetch** (`lib/services/match-service.ts`)
   - Fetch today's fixtures from API-Football v3
   - Target leagues: Ligue 1, Premier League, La Liga, Serie A, Bundesliga, UEFA Champions League, Ligue 1 Ivoirienne, local West African leagues
   - Filter: exclude fixtures with insufficient data (< 5 prior matches per team)

2. **Odds enrichment** (`lib/services/match-service.ts`)
   - For each fixture, fetch odds from The Odds API
   - Merge odds onto fixture object
   - If The Odds API quota exhausted: use API-Football pre-match odds as fallback

3. **6-Signal Analysis** (`lib/services/analysis-engine.ts`)
   - Run existing analysis engine per match
   - Cache result in Redis 12h TTL (key: `analysis:{matchId}:{date}`)
   - Return structured score 0-100 per match

4. **Ticket Generation** (`lib/services/ticket-generator.ts` — new file)
   - `generateClassicTicket(scoredMatches)` → 3-4 picks, confidence >65%
   - `generateOptimusTicket(scoredMatches)` → 2-3 picks, highest EV
   - `generateMontanteTicket(scoredMatches)` → 4-6 picks with base stake amount
   - If < 2 qualifying matches found: lower thresholds by 10%, retry once

5. **Storage** (`lib/services/ticket-generator.ts`)
   - Upsert into `daily_ticket` table (upsert on date+type to allow re-runs)
   - Log generation via `generated_at` + `generation_error` columns on `daily_ticket` (add in migration)

6. **Notifications** (`lib/services/notification-service.ts`)
   - Send web push to all `push_subscriptions` on success
   - Send email digest to premium/VIP users

**Montante amount calculation:**
- Base stake: configurable via `admin_settings` table (default: 1000 XOF)
- Progression: each leg multiplies stake by `1 / (cumulative_odds - 1)` targeting 100% return
- Display: "Mise Départ: 1000 FCFA → Gain Net Cible: 1000 FCFA"

---

### Phase 3 — AI Fallback Chain (~1 hour)

**File: `lib/services/ai-provider.ts`** (new unified AI provider)

```typescript
// Unified interface — never fails silently
async function analyzeMatch(matchData): Promise<AIAnalysis> {
  try {
    return await veniceAnalyze(matchData)      // Primary: Venice AI
  } catch {
    try {
      return await groqAnalyze(matchData)       // Fallback: Groq
    } catch {
      return ruleBasedAnalyze(matchData)        // Emergency: pure stats
    }
  }
}
```

**AI output schema (French reasoning):**
```typescript
interface AIAnalysis {
  prediction: string        // "1X" | "2" | "BTTS" | "Over 2.5" etc.
  confidence: number        // 0-100
  reasoning: string         // French explanation for users
  risk: "faible" | "modéré" | "élevé"
  value: boolean            // positive expected value?
  odds_target: number       // recommended odds
}
```

**Venice AI prompt:** French-language, West African context, referencing popular leagues and teams. System prompt cached in Redis (key: `prompt:match-analysis:v1`, TTL 7 days) to avoid re-sending on every call.

**Rule-based fallback:** Uses existing Dixon-Coles + Poisson from `lib/services/prediction/` — no AI call, pure math. Returns generic French reasoning string.

---

### Phase 4 — Production Hardening (~1 hour)

**Env validation: `lib/config/env.ts`**
```typescript
const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VENICE_API_KEY',
  'API_FOOTBALL_KEY',
  'RESEND_API_KEY',
  'ADMIN_EMAILS',
  'NEXT_PUBLIC_APP_URL',
]
// Called at top of each API route — throws descriptive error if missing
```

**Exponential backoff: `lib/utils/retry.ts`**
- `withRetry(fn, maxAttempts=3, baseDelayMs=1000)`
- Used on all external API calls (Venice, Groq, API-Football, The Odds API)

**Rate limit verification:**
- Free users: 2 combines/day — verify in `/api/generate` using `combine_usage_log` count
- Anonymous: 1 trial — verify via HttpOnly cookie + Supabase session
- Admin routes: double-check `checkIsAdmin()` used on every admin endpoint

**Security cleanup:**
- Add to `.gitignore`: `*.bin`, `cookies.txt`, `service-account.json.json`, `*.local`
- Remove already-committed sensitive files from git history (git rm --cached)
- Audit: all Supabase tables have RLS enabled (check migration files)

**Admin monitoring: `/api/admin/diagnose`**
- Live check: Venice AI ping, API-Football quota remaining, The Odds API credits, Resend status
- Last ticket generation timestamp + status
- Redis connection status

---

### Phase 5 — UI Polish (~1 hour)

**Badge component:**
- Add `gradient` variant to `components/ui/badge.tsx` cva config
- Gradient: `bg-gradient-to-r from-emerald-500 to-cyan-500 text-white`

**Mobile audit:**
- Verify all ticket widgets render correctly on 375px (iPhone SE)
- Ensure tap targets ≥ 44px
- French text truncation handled (long team names)

**French UX consistency:**
- All AI reasoning displayed in French
- Date formats: `lundi 18 mai 2026` (French locale)
- Currency: `FCFA` / `XOF`
- Error messages in French

**Dashboard widgets (verify working):**
- `TicketDuJourWidget` — shows today's Classic ticket
- `TicketOptimusWidget` — shows Optimus ticket
- `TicketMontanteWidget` — shows Montante ticket with base stake amount
- All 3 must display gracefully if no ticket generated yet (loading state)

---

## Data Contracts

### `daily_ticket` table (Supabase)

```sql
id            uuid PRIMARY KEY
date          date NOT NULL
type          text CHECK (type IN ('classic', 'optimus', 'montante'))
matches       jsonb NOT NULL   -- array of match selections
total_odds    numeric
stake_amount  numeric          -- for montante only
analysis      text             -- AI reasoning summary in French
status        text DEFAULT 'pending' CHECK (status IN ('pending','won','lost','void'))
generated_at  timestamptz DEFAULT now()
resolved_at   timestamptz
UNIQUE (date, type)
```

### Match selection object (in `matches` jsonb array)

```json
{
  "match_id": "123456",
  "home_team": "Lyon",
  "away_team": "Marseille",
  "league": "Ligue 1",
  "kickoff": "2026-05-18T18:00:00Z",
  "prediction": "1X",
  "odds": 1.75,
  "confidence": 72,
  "reasoning": "Lyon en grande forme (4V/5)...",
  "risk": "modéré"
}
```

---

## Leagues Targeted

| League | API-Football ID | Priority |
|--------|----------------|----------|
| Premier League | 39 | High |
| Ligue 1 (France) | 61 | High |
| La Liga | 140 | High |
| Serie A | 135 | High |
| Bundesliga | 78 | Medium |
| UEFA Champions League | 2 | High |
| Europa League | 3 | Medium |
| Ligue 1 Ivoirienne | 302 | High (target market) |
| Super Ligue Sénégal | 270 | Medium |
| Championnat Bénin | 289 | Medium |

---

## Non-Goals

- No Sentry integration (monitoring via admin diagnose endpoint is sufficient for V1)
- No WhatsApp integration (incomplete, deferred to V2)
- No payment/FedaPay changes (existing system stays)
- No new pages or features beyond what's described

---

## Success Criteria

- [ ] `npm run build` passes with 0 errors
- [ ] Daily ticket generation cron runs automatically at 05:00 UTC
- [ ] All 3 ticket types (Classic, Optimus, Montante) stored in Supabase each day
- [ ] AI fallback chain tested: Venice → Groq → rule-based
- [ ] `/api/admin/diagnose` returns live status of all APIs
- [ ] No sensitive files in git
- [ ] Mobile renders correctly at 375px
- [ ] All error messages and AI reasoning in French
- [ ] Vercel deployment succeeds with 0 build errors

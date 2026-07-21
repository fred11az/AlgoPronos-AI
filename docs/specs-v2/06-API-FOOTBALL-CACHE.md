# ⚽ API-FOOTBALL CACHE STRATEGY & DATA MODEL

**Version**: 1.0 | **Auteur**: World Buzzy Investissement Trading | **Date**: Juin 2026

---

## 🎯 Principe Fondamental (RÈGLE D'OR)

```
❌ JAMAIS:
User → API-Football directement
User → Trigger API-Football appel

✅ TOUJOURS:
Backend SEUL → API-Football
Backend → Supabase Cache
User → Backend → Supabase Cache
```

**Raison**: 
- Sécurité (pas de clés API exposées)
- Coûts maîtrisés (7,500 appels/jour avec plan Pro sufisent)
- Performance (cache < 50ms vs API 2s)
- Fiabilité (contrôle des pics d'appels)

---

## 📊 DONNÉES À RÉCUPÉRER (Complète)

### Catégorie 1: Informations Générales (Match)

```
✅ Nom du championnat
✅ Pays
✅ Saison
✅ Journée (matchday)
✅ Date et heure du match
✅ Stade
✅ Arbitre (souvent disponible)
✅ Statut du match (scheduled/live/finished)
✅ Statistiques en direct (si live)
```

### Catégorie 2: Équipes

```
✅ Nom des équipes (home + away)
✅ Logo (URL)
✅ ID de l'équipe (pour requêtes futures)
✅ Classement actuel
✅ Position dans le championnat
✅ Nombre de matchs joués
✅ Code pays
```

### Catégorie 3: Statistiques Pré-Match

```
✅ Forme récente (5 + 10 derniers matchs)
✅ Victoires / Nuls / Défaites
✅ Buts marqués (total + moyenne)
✅ Buts encaissés (total + moyenne)
✅ Clean sheets (matchs sans encaisser)
✅ BTTS (Both Teams To Score) - % de matchs
✅ Plus/Moins 2,5 buts - % de matchs
✅ Séries en cours (W-W-W-D, etc.)
✅ Différence de buts
✅ Streak gagné/perdu
```

### Catégorie 4: Confrontations Directes (Head-to-Head)

```
✅ Derniers matchs entre les deux équipes (10+)
✅ Scores
✅ Nombre de victoires de chaque équipe
✅ Moyenne de buts dans les H2H
✅ Buts marqués / encaissés en H2H
✅ Avantage domicile (si applicable)
```

### Catégorie 5: Joueurs

```
✅ Effectif complet
✅ Buteurs (top scorers)
✅ Passeurs (top assisters)
✅ Statistiques individuelles
✅ Temps de jeu
✅ Cartons (jaunes + rouges)
✅ Forme récente des joueurs clés
```

### Catégorie 6: Blessures & Suspensions (TRÈS IMPORTANT)

```
✅ Joueurs blessés (liste complète)
✅ Date retour estimée
✅ Joueurs suspendus
✅ Raison suspension
✅ Retour de blessure (joueurs à suivre)
✅ Impact potentiel (joueur clé ou remplaçant?)
```

### Catégorie 7: Compositions

**Avant le match** (J-2 minimum):
```
✅ Compositions probables (selon compétitions)
✅ Formation (4-3-3, etc.)
✅ Remplaçants probables
```

**Environ 1h avant coup d'envoi**:
```
✅ Compositions officielles
✅ Remplaçants confirmés
✅ Formation officielle
✅ Changements vs prediction
```

### Catégorie 8: Statistiques Équipes Avancées

```
✅ Possession moyenne (%)
✅ Tirs (totaux)
✅ Tirs cadrés
✅ Corners
✅ Fautes
✅ Cartons (jaunes + rouges)
✅ Expected Goals (xG) - si disponible
✅ Création d'occasions
✅ Qualité des passes (%)
✅ Interceptions
```

### Catégorie 9: Les Cotes (SI DISPONIBLE)

```
✅ Victoire domicile (1)
✅ Match nul (X)
✅ Victoire extérieur (2)
✅ Double chance
✅ Plus/Moins 2,5 buts
✅ BTTS (Both Teams To Score)
✅ Handicap
✅ Score exact
✅ Autres marchés selon couverture
```

**IMPORTANT**: Les cotes changent plusieurs fois par jour
→ Doivent être mises à jour plus souvent que les matchs

---

## 🏗️ ARCHITECTURE SUPABASE (Tables)

### Table 1: competitions

```sql
CREATE TABLE competitions (
  id UUID PRIMARY KEY,
  api_id INTEGER UNIQUE,
  name VARCHAR(255),
  country VARCHAR(100),
  logo_url TEXT,
  type VARCHAR(50), -- league, cup, tournament
  season INTEGER,
  
  current_round INTEGER,
  total_rounds INTEGER,
  
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  
  coverage_level VARCHAR(50), -- high, medium, low
  has_standings BOOLEAN,
  has_statsd BOOLEAN,
  has_fixtures BOOLEAN,
  
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  
  metadata JSONB
);
```

### Table 2: teams

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  api_id INTEGER UNIQUE,
  name VARCHAR(255),
  country VARCHAR(100),
  founded INTEGER,
  logo_url TEXT,
  
  -- Stocké pour éviter requête futur
  venue_name VARCHAR(255),
  venue_capacity INTEGER,
  venue_city VARCHAR(255),
  venue_surface VARCHAR(50),
  
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  
  metadata JSONB
);
```

### Table 3: matches

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  api_id INTEGER UNIQUE,
  
  -- Références
  competition_id UUID REFERENCES competitions,
  home_team_id UUID REFERENCES teams,
  away_team_id UUID REFERENCES teams,
  
  -- Match info
  league_name VARCHAR(255),
  round_number INTEGER,
  date TIMESTAMP NOT NULL, -- Index this
  status VARCHAR(50), -- scheduled, live, finished
  referee VARCHAR(255),
  venue_name VARCHAR(255),
  
  -- Résultats (si terminé)
  home_goals INTEGER,
  away_goals INTEGER,
  extra_time_home INTEGER,
  extra_time_away INTEGER,
  penalties_home INTEGER,
  penalties_away INTEGER,
  
  -- Statistiques (si disponibles)
  home_shots INTEGER,
  home_shots_on_target INTEGER,
  home_fouls INTEGER,
  home_corners INTEGER,
  home_possession INTEGER,
  home_passes INTEGER,
  home_xg DECIMAL(5,2),
  
  away_shots INTEGER,
  away_shots_on_target INTEGER,
  away_fouls INTEGER,
  away_corners INTEGER,
  away_possession INTEGER,
  away_passes INTEGER,
  away_xg DECIMAL(5,2),
  
  -- Métadonnées
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  metadata JSONB,
  
  -- Indexes
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_competition (competition_id)
);
```

### Table 4: odds

```sql
CREATE TABLE odds (
  id UUID PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches,
  
  bookmaker VARCHAR(100), -- 1xbet, betfair, etc.
  
  -- Basic markets
  home_win DECIMAL(6,2),
  draw DECIMAL(6,2),
  away_win DECIMAL(6,2),
  
  -- Over/Under
  over_2_5 DECIMAL(6,2),
  under_2_5 DECIMAL(6,2),
  
  -- BTTS
  btts_yes DECIMAL(6,2),
  btts_no DECIMAL(6,2),
  
  -- Double Chance
  double_chance_12 DECIMAL(6,2), -- Home or Draw
  double_chance_1x DECIMAL(6,2), -- Home or Draw (same)
  double_chance_x2 DECIMAL(6,2), -- Draw or Away
  
  -- Handicap
  handicap_home DECIMAL(6,2),
  handicap_away DECIMAL(6,2),
  
  -- Score Exact (stored as JSON)
  exact_scores JSONB,
  
  synced_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now(),
  
  INDEX idx_match_bookmaker (match_id, bookmaker)
);
```

### Table 5: team_statistics

```sql
CREATE TABLE team_statistics (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams,
  season INTEGER,
  
  -- Matchs joués
  matches_played INTEGER,
  matches_won INTEGER,
  matches_drawn INTEGER,
  matches_lost INTEGER,
  
  -- Buts
  goals_for INTEGER,
  goals_against INTEGER,
  goal_difference INTEGER,
  
  -- Moyennes
  goals_per_match DECIMAL(5,2),
  goals_conceded_per_match DECIMAL(5,2),
  
  -- Streaks
  clean_sheets INTEGER,
  failed_to_score INTEGER,
  
  -- Récent (5 derniers)
  form_5_recent VARCHAR(5), -- W-D-L-W-W format
  form_5_wins INTEGER,
  form_5_draws INTEGER,
  form_5_losses INTEGER,
  
  -- Récent (10 derniers)
  form_10_recent VARCHAR(10),
  form_10_wins INTEGER,
  form_10_draws INTEGER,
  form_10_losses INTEGER,
  
  -- Home/Away
  home_wins INTEGER,
  away_wins INTEGER,
  home_goals_for INTEGER,
  away_goals_for INTEGER,
  
  synced_at TIMESTAMP,
  
  INDEX idx_team_season (team_id, season)
);
```

### Table 6: head_to_head

```sql
CREATE TABLE head_to_head (
  id UUID PRIMARY KEY,
  home_team_id UUID NOT NULL REFERENCES teams,
  away_team_id UUID NOT NULL REFERENCES teams,
  
  -- Historique
  total_matches INTEGER,
  home_wins INTEGER,
  draws INTEGER,
  away_wins INTEGER,
  
  goals_for_home INTEGER,
  goals_for_away INTEGER,
  
  avg_goals DECIMAL(5,2),
  avg_goals_home DECIMAL(5,2),
  avg_goals_away DECIMAL(5,2),
  
  -- Récents (10 derniers)
  recent_10_matches JSONB, -- array of {date, home_goal, away_goals, winner}
  
  synced_at TIMESTAMP,
  
  UNIQUE (home_team_id, away_team_id)
);
```

### Table 7: player_statistics

```sql
CREATE TABLE player_statistics (
  id UUID PRIMARY KEY,
  api_id INTEGER UNIQUE,
  
  team_id UUID NOT NULL REFERENCES teams,
  
  name VARCHAR(255),
  position VARCHAR(50),
  number INTEGER,
  
  nationality VARCHAR(100),
  birth_date DATE,
  
  -- Statistiques
  games_played INTEGER,
  minutes_played INTEGER,
  goals INTEGER,
  assists INTEGER,
  
  yellow_cards INTEGER,
  red_cards INTEGER,
  
  passes_accuracy DECIMAL(5,2),
  tackles INTEGER,
  interceptions INTEGER,
  
  synced_at TIMESTAMP,
  
  INDEX idx_team (team_id)
);
```

### Table 8: injuries

```sql
CREATE TABLE injuries (
  id UUID PRIMARY KEY,
  api_id INTEGER UNIQUE,
  
  player_id UUID REFERENCES player_statistics,
  team_id UUID NOT NULL REFERENCES teams,
  
  player_name VARCHAR(255),
  player_position VARCHAR(50),
  
  type VARCHAR(50), -- injury, suspension
  reason TEXT,
  
  start_date TIMESTAMP,
  expected_return_date TIMESTAMP,
  
  is_doubtful BOOLEAN,
  is_confirmed BOOLEAN,
  
  synced_at TIMESTAMP,
  
  -- Auto-cleanup after return date
  INDEX idx_team_expected_return (team_id, expected_return_date)
);
```

### Table 9: standings

```sql
CREATE TABLE standings (
  id UUID PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES competitions,
  
  round_number INTEGER,
  group_name VARCHAR(100), -- pour groupes de tournoi
  
  team_id UUID NOT NULL REFERENCES teams,
  
  position INTEGER,
  points INTEGER,
  
  played INTEGER,
  won INTEGER,
  drawn INTEGER,
  lost INTEGER,
  
  goals_for INTEGER,
  goals_against INTEGER,
  goal_difference INTEGER,
  
  home_points INTEGER,
  away_points INTEGER,
  
  synced_at TIMESTAMP,
  
  INDEX idx_competition_round (competition_id, round_number),
  INDEX idx_team_position (team_id, position)
);
```

### Table 10: lineups

```sql
CREATE TABLE lineups (
  id UUID PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches,
  team_id UUID NOT NULL REFERENCES teams,
  
  formation VARCHAR(50), -- 4-3-3, etc.
  coach_name VARCHAR(255),
  
  -- Lineup (array of players)
  starting_xi JSONB, -- [{player_id, name, position, number}]
  substitutes JSONB,
  
  synced_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now(),
  
  INDEX idx_match (match_id)
);
```

---

## 🔄 STRATÉGIE DE CACHE: Fenêtre Glissante

### Principe

```
Au lieu de cacher seulement les matchs du jour,
cache une FENÊTRE GLISSANTE de 7-14 jours.

Jour 1 (19 juillet):
Cache matchs 19-26 juillet

Jour 2 (20 juillet):
Cache matchs 20-27 juillet
(Les matchs 20-26 sont mis à jour, 27 est ajouté)

Jour 3 (21 juillet):
Cache matchs 21-28 juillet
(Même logique)

Avantage:
✅ Utilisateurs peuvent composer pour aujourd'hui, demain, samedi, etc.
✅ Un seul appel API par jour (max 2-3 pour mises à jour)
✅ Réchauffement du cache naturel
✅ Performance ultra-rapide (<50ms)
✅ Claude peut analyser n'importe quel match dans la fenêtre
```

### Calendrier des Appels API

```
CRON: Chaque nuit à 02:00 UTC+1
├─ 1 appel: "Tous matchs du J+0 au J+7"
├─ Update Supabase (upsert)
└─ Cost: 1 appel

CRON: Chaque jour à 10:00 UTC+1 (pour cotes changeantes)
├─ 1 appel: "Cotes pour matchs de demain à J+7"
├─ Update odds table (plus haute fréquence)
└─ Cost: 1 appel

CRON: 2h avant chaque match majeur
├─ 1 appel: "Compositions officielles + nouvelles blessures"
├─ Update lineups + injuries
└─ Cost: 1-2 appels max

CRON: 24h après match terminé
├─ 1 appel: "Résultats détaillés + statistiques"
├─ Update match + statistiques
└─ Cost: 1 appel (batch de résultats)

TOTAL PAR JOUR: 4-6 appels maximum
Plan Pro limite: 300 appels/min = 7,500/jour
Utilisation: < 1% ✅
```

---

## 🧠 COMMENT CLAUDE UTILISE LES DONNÉES

### Exemple: Analyse Intelligent des Cotes (Edge Analysis)

```
Match: Real Madrid vs Barcelone
Dimanche 22 juin, 15:00

DONNÉES SUPABASE:

Real Madrid:
├─ Form: W-W-W-D-W (92% win rate)
├─ Goals: 2.8/match
├─ xG: 2.2
├─ Home advantage: +0.4 buts
└─ vs Barcelona H2H: 3-2-5 (légèrement en retard)

Barcelona:
├─ Form: W-W-D-L-W (60% win rate)
├─ Goals: 1.8/match
├─ xG: 1.4
├─ Away record: 1.1 buts/match
└─ Blessures: 2 joueurs clés absents

COTES 1xBET:

Real Madrid Gagne: 1.65 (implied: 60%)
Barcelona Gagne: 2.20 (implied: 45%)
Draw: 3.80 (implied: 26%)

Over 2.5 buts: 1.80 (implied: 56%)
Under 2.5 buts: 1.95 (implied: 51%)

Real Madrid + Over 2.5: 2.70 (implied: 37%)


ANALYSE CLAUDE (Intelligent):

❌ Ne pas dire: "Real Madrid va gagner"
   Cote 1.65 = faible valeur

✅ À la place:

"Analyse Edge:

1. Prédiction vraie (IA):
   Real Madrid gagne: 65% probabilité
   Expected goals: 2.8 vs 1.1

2. Cote 1xBet:
   Real Madrid gagne: 1.65 → Cote implicite: 60%
   Over 2.5: 1.80 → Cote implicite: 56%

3. Value Detection:
   
   ÉCART 1: Real gagne (65% réel vs 60% implicite)
   → Edge: +5% mais faible
   → Valeur marginale ❌
   
   ÉCART 2: Real gagne + Over 2.5 (37.5% réel vs 37% implicite)
   → Cote combinée: 2.70
   → Edge: +0.5% mais très faible ❌
   
   ÉCART 3: Over 2.5 buts solo (56% réel vs 51% implicite)
   → Cote: 1.95
   → Edge: +5% ✅ Meilleur compromis

4. Recommandation:
   
   Au lieu de parier Real Madrid @ 1.65,
   préférez Over 2.5 @ 1.95
   
   Raison: Real jouera agressif (forme top),
   Barcelona forcera jeu malgré blessures.
   Risque = moderate, Valeur = supérieure"

RECOMMANDATION: Over 2.5 buts @ 1.95
Edge: +5%
Confiance: 72%
```

### Le Point Clé

```
Claude ne choisit pas le pari "le plus probable".
Claude choisit le pari avec le MEILLEUR EDGE.

C'est ça la vraie intelligence AlgoPronos.
```

---

## 🚀 IMPLEMENTATION BACKEND

### Cron Job Principal (Nuit)

```javascript
// cron: 02:00 UTC+1 daily

async function syncMatchesWindow() {
  const startDate = new Date(); // Today
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
  
  console.log(`Syncing matches from ${startDate} to ${endDate}`);
  
  try {
    // 1. Call API-Football
    const apiResponse = await apiFootball.getMatches({
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    });
    
    // 2. Transform & Validate
    const transformedMatches = apiResponse.map(match => ({
      api_id: match.id,
      competition_id: getOrCreateCompetition(match.league),
      home_team_id: getOrCreateTeam(match.teams.home),
      away_team_id: getOrCreateTeam(match.teams.away),
      date: match.fixture.date,
      status: match.fixture.status,
      // ... other fields
      synced_at: new Date(),
    }));
    
    // 3. Upsert to Supabase
    await supabase.from('matches').upsert(transformedMatches, {
      onConflict: 'api_id', // If exists, update; if new, insert
    });
    
    console.log(`✅ Synced ${transformedMatches.length} matches`);
    
    // 4. Trigger downstream
    await triggerTicketGeneration(); // Will use cached data
    
  } catch (error) {
    console.error('Sync failed:', error);
    // Still use cached data, sync retried tomorrow
  }
}
```

### Fetch Data for Claude (Backend Service)

```javascript
// When Ticket Generation needs data

async function getMatchDataForClaude(matchId) {
  // Query Supabase (all data already cached)
  const match = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();
  
  const [homeTeamStats, awayTeamStats, h2h, odds, lineups, injuries] = 
    await Promise.all([
      supabase.from('team_statistics').select('*').eq('team_id', match.home_team_id),
      supabase.from('team_statistics').select('*').eq('team_id', match.away_team_id),
      supabase.from('head_to_head').select('*')
        .eq('home_team_id', match.home_team_id)
        .eq('away_team_id', match.away_team_id),
      supabase.from('odds').select('*').eq('match_id', match.id),
      supabase.from('lineups').select('*').eq('match_id', match.id),
      supabase.from('injuries').select('*')
        .or(`team_id.eq.${match.home_team_id},team_id.eq.${match.away_team_id}`),
    ]);
  
  // Format pour Claude
  return {
    match: {
      date: match.date,
      venue: match.venue_name,
      competition: match.league_name,
      referee: match.referee,
    },
    home: {
      name: match.home_team.name,
      stats: homeTeamStats,
      lineups: lineups.filter(l => l.team_id === match.home_team_id),
      injuries: injuries.filter(i => i.team_id === match.home_team_id),
    },
    away: {
      name: match.away_team.name,
      stats: awayTeamStats,
      lineups: lineups.filter(l => l.team_id === match.away_team_id),
      injuries: injuries.filter(i => i.team_id === match.away_team_id),
    },
    h2h: h2h,
    odds: odds,
    
    metadata: {
      data_freshness: match.synced_at,
      lineups_confidence: lineups.length > 0 ? 'official' : 'predicted',
    }
  };
}
```

---

## 🔒 RÈGLES À RESPECTER

### Rule 1: Backend Only

```
❌ JAMAIS:
- User clique → API-Football call
- Frontend code → API-Football endpoint
- Cloud function → User-triggered → API call

✅ TOUJOURS:
- Backend cron → API-Football
- Backend → Supabase Cache
- User → Backend → Supabase
```

### Rule 2: Cache First

```
❌ JAMAIS:
- Claude: "Appelle API pour les cotes"
- Backend: "Cherche en temps réel"

✅ TOUJOURS:
- Claude: "Utilise les cotes cachées"
- Backend: "Cherche d'abord en cache, puis update async"
```

### Rule 3: Fréquence d'Update Intelligente

```
Matchs futurs: 1x par nuit (changent peu)
Cotes: 2-3x par jour (changent souvent)
Injuries: 2-3x par jour (peuvent changer rapidement)
Lineups: 1x la veille + 1x H-1h match (officialisées progressivement)
Résultats: 1x après match + quelques heures (vérification)
```

### Rule 4: Pas de Requêtes Par-Match

```
❌ MAUVAIS:
Utilisateur sélectionne 5 matchs
→ Backend appelle API 5 fois

✅ BON:
Utilisateur sélectionne 5 matchs
→ Données déjà en Supabase (depuis cron)
→ Backend requête Supabase WHERE match_id IN (...)
→ Query time: < 100ms
```

---

## 📈 PERFORMANCE & COÛTS

### Requêtes API-Football

```
Appels/jour: 4-6
Limite Plan Pro: 7,500/jour
Utilisation: 0.08%

Coût: $99/mois (plan Pro)
Coût par match: $0.01 (dividé sur 10,000 matchs/jour)
```

### Requêtes Supabase

```
Par utilisateur (par jour):
- Affiche matches: 1 requête = < 50ms
- Compose ticket: 5 requêtes = < 500ms
- Dashboard: 3 requêtes = < 300ms

Total par user/jour: 9 requêtes
1,000 users × 9 = 9,000 requêtes/jour

Limite Supabase (Free): 50,000 requêtes/jour ✅
Coût: Gratuit jusqu'à 50k, puis scalable
```

### Performance

```
- Cache hit rate: > 90%
- Query time (cached): < 50ms
- Query time (API fresh): 2-3 secondes (une fois)
- Time to render: < 500ms total
```

---

## 🎯 EXEMPLE: USER COMPOSE UN TICKET

```
JOUR 1: Utilisateur ouvre "Mes Tickets"

1. Backend query:
   SELECT * FROM matches 
   WHERE date BETWEEN today AND today+7 
   ORDER BY date

2. Supabase responds (< 50ms):
   [100 matches next 7 days]

3. Frontend displays:
   "Choisir un match"
   [List 100 matches avec equipes, cotes, heures]

UTILISATEUR SÉLECTIONNE 3 MATCHS

4. Backend fetches detailed data (from cache):
   - Match stats
   - Team statistics
   - Head-to-head
   - Odds
   - Injuries
   - Lineups (if available)

5. Claude receives JSON:
   {
     matches: [3 detailed matches],
     request: "Generate ticket with medium risk",
   }

6. Claude analyzes (2s):
   - Team form
   - Head-to-head
   - Injuries impact
   - Value detection in odds
   - Edge calculation

7. Claude recommends:
   Match 1: Home Win (edge +5%)
   Match 2: Over 2.5 (edge +4%)
   Match 3: BTTS (edge +3%)

8. Backend saves ticket:
   - Stores in database
   - Sends to user

TOTAL TIME: 3-4 seconds
API CALLS: 0 (all cached!)
```

---

## ✅ CHECKLIST IMPLÉMENTATION

- [ ] Créer tables Supabase (10 tables)
- [ ] Créer API-Football account + key
- [ ] Implémenter cron sync (02:00 chaque nuit)
- [ ] Implémenter cron odds update (10:00 + 16:00)
- [ ] Implémenter cron lineups update (18:00 + H-1h)
- [ ] Implémenter getMatchDataForClaude() function
- [ ] Indexer toutes les tables correctement
- [ ] Tester avec 7 jours de données
- [ ] Valider performance (< 100ms queries)
- [ ] Setup monitoring des appels API
- [ ] Documenter architecture pour équipe
- [ ] Tester edge cases (API down, rate limit, etc.)

---

**Cette architecture = Fondation solide pour AlgoPronos V2**

**Clé**: Un seul backend accède à l'API, tout le reste se fait en cache ultra-rapide.

**Résultat**: Performance explosive, coûts maîtrisés, Croissance exponentielle.

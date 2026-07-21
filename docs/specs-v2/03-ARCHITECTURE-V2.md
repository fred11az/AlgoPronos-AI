# 🏗️ ARCHITECTURE TECHNIQUE ALGOPRONOS V2

**Version**: 2.0 | **Auteur**: World Buzzy Investissement Trading | **Date**: Juin 2026

---

## 🎯 Vision Architecturale

AlgoPronos V2 n'est **pas un site de pronostics**.

C'est une **plateforme intelligente entièrement automatisée** capable de:

- 🎣 **Acquérir** des prospects via Facebook
- 🔄 **Convertir** via Sales AI
- 🤖 **Générer** automatiquement des analyses avec Claude
- 📱 **Fidéliser** via WhatsApp
- 💰 **Monétiser** via abonnements + Partners

L'architecture doit être:
- ✅ **Modulaire** (chaque composant indépendant)
- ✅ **Évolutive** (scale sans refonte)
- ✅ **Automatisée** (zéro friction)
- ✅ **Sécurisée** (données protégées)

---

## 🏛️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALGOPRONOS V2 ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND LAYER                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  Web (React) │ Mobile (iOS/Android) │ WhatsApp (Bot)    │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│         ↓↓↓ (HTTPS REST + WebSocket)                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  API GATEWAY LAYER                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Authentication │ Rate Limiting │ Request Validation      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│         ↓↓↓                                                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              BACKEND SERVICE LAYER (Node.js)            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ┌─────────────────┐  ┌─────────────────┐               │  │
│  │  │  Sales AI Svc   │  │ Ticket Gen Svc  │               │  │
│  │  └─────────────────┘  └─────────────────┘               │  │
│  │                                                          │  │
│  │  ┌─────────────────┐  ┌─────────────────┐               │  │
│  │  │  Partner Sync   │  │ WhatsApp Agent  │               │  │
│  │  └─────────────────┘  └─────────────────┘               │  │
│  │                                                          │  │
│  │  ┌─────────────────┐  ┌─────────────────┐               │  │
│  │  │ Account Verify  │  │  Analytics Svc  │               │  │
│  │  └─────────────────┘  └─────────────────┘               │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│         ↓↓↓                                                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   DATA LAYER                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  Supabase (PostgreSQL)                                  │  │
│  │  ├─ Users                                               │  │
│  │  ├─ Tickets (cache - jamais recalculé)                  │  │
│  │  ├─ Matches (cache - mis à jour quotidien)              │  │
│  │  ├─ Statistics (cache)                                  │  │
│  │  ├─ Partners (sync avec bookmakers)                     │  │
│  │  ├─ Conversations (Sales AI history)                    │  │
│  │  └─ Transactions (commissions, abonnements)             │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│         ↓↓↓                                                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              EXTERNAL SERVICE LAYER                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ⚽ Football Data API → Backend → Supabase Cache         │  │
│  │  📱 Facebook Messenger → Sales AI                       │  │
│  │  📲 WhatsApp → Community Manager                        │  │
│  │  💬 Claude API → Ticket Generation                      │  │
│  │  📊 1xBet/Bookmakers → Partner Sync                     │  │
│  │  📧 Sendgrid → Notifications                            │  │
│  │  🔔 Firebase → Push Notifications                       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🔒 PRINCIPLES:                                                 │
│  ✅ APIs externes JAMAIS appelées directement par utilisateurs │
│  ✅ Claude raisonne UNIQUEMENT sur données préparées            │
│  ✅ Chaque module INDÉPENDANT et ÉVOLUTIF                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 MODULE 1: SALES AI SERVICE

### Architecture

```
┌─────────────────────────────────────────────┐
│          SALES AI SERVICE                   │
├─────────────────────────────────────────────┤
│                                             │
│  Incoming: Facebook Messenger Message      │
│           (via Messenger Platform API)     │
│                    ↓                        │
│  ┌─────────────────────────────────────┐   │
│  │ 1. Message Ingestion                │   │
│  │    ├─ Parse message                 │   │
│  │    ├─ Identify user by FB ID        │   │
│  │    └─ Route to correct flow         │   │
│  └─────────────────────────────────────┘   │
│                    ↓                        │
│  ┌─────────────────────────────────────┐   │
│  │ 2. Fetch User Context (Supabase)    │   │
│  │    ├─ Conversation history          │   │
│  │    ├─ Current stage (1-10)          │   │
│  │    ├─ Objections logged             │   │
│  │    └─ Profile data                  │   │
│  └─────────────────────────────────────┘   │
│                    ↓                        │
│  ┌─────────────────────────────────────┐   │
│  │ 3. Generate Response (Claude)       │   │
│  │    ├─ Input: context + message      │   │
│  │    ├─ Claude generates reply        │   │
│  │    └─ Output: next action           │   │
│  └─────────────────────────────────────┘   │
│                    ↓                        │
│  ┌─────────────────────────────────────┐   │
│  │ 4. Update Supabase                  │   │
│  │    ├─ Log conversation              │   │
│  │    ├─ Update stage                  │   │
│  │    ├─ Schedule relance if needed    │   │
│  │    └─ Trigger automation            │   │
│  └─────────────────────────────────────┘   │
│                    ↓                        │
│  Outgoing: Facebook Messenger Response     │
│           (via Messenger Platform API)     │
│                                             │
└─────────────────────────────────────────────┘
```

### Données Stockées (Supabase)

```sql
TABLE: prospects
├─ id (UUID)
├─ facebook_id (unique)
├─ phone (optional)
├─ country
├─ current_stage (1-10)
├─ main_objection (string)
├─ last_interaction (timestamp)
├─ created_at
└─ metadata (JSON)

TABLE: conversations
├─ id (UUID)
├─ prospect_id (FK)
├─ message_type (incoming/outgoing)
├─ message_text
├─ context (used for Claude)
├─ response (from Claude)
├─ timestamp
└─ stage_at_message

TABLE: relances
├─ id (UUID)
├─ prospect_id (FK)
├─ relance_number (1/2/3)
├─ scheduled_at
├─ sent_at (null if pending)
└─ template (24h/72h/7j)
```

### Independencia Module

✅ Sales AI peut évoluer **sans affecter** Ticket Generation
✅ Claude prompts peuvent être optimisés séparément
✅ Rate limiting et caching gérés indépendamment

---

## 📦 MODULE 2: API FOOTBALL SERVICE

### Principe Fondamental

```
❌ JAMAIS:
Utilisateur → API Football directement
Utilisateur → Claude accède à API Football

✅ TOUJOURS:
API Football → Backend → Supabase (Cache) → Claude
```

### Architecture

```
┌────────────────────────────────────────────────┐
│         API FOOTBALL SERVICE                   │
├────────────────────────────────────────────────┤
│                                                │
│  CRON JOB: Chaque matin (07:00 UTC+1)         │
│                                                │
│  1. Get Matches (Supabase)                    │
│     └─ Récupère matchs du jour en cache      │
│                                                │
│  2. Si pas en cache OU outdated:             │
│     ├─ API Football → Get matches             │
│     ├─ API Football → Get statistics          │
│     ├─ API Football → Get standings           │
│     ├─ API Football → Get form                │
│     ├─ API Football → Get head-to-head        │
│     └─ API Football → Get injuries            │
│                                                │
│  3. Store in Supabase Cache                  │
│     ├─ matches table (+ meta)                 │
│     ├─ statistics table                       │
│     ├─ standings table                        │
│     └─ last_updated timestamp                 │
│                                                │
│  4. Trigger Ticket Generation                │
│     └─ Backend calls Claude with data        │
│                                                │
│  Data Flow:                                    │
│  Football Data API                            │
│          ↓                                     │
│  Backend Service (Node.js)                    │
│          ↓                                     │
│  Supabase Cache                               │
│          ↓                                     │
│  Claude (for analysis)                        │
│          ↓                                     │
│  Users (final output)                         │
│                                                │
└────────────────────────────────────────────────┘
```

### Cache Structure (Supabase)

```sql
TABLE: matches
├─ id (UUID)
├─ external_id (API Football ID)
├─ league
├─ date
├─ home_team
├─ away_team
├─ status (scheduled/live/finished)
├─ result (JSON - goals, stats)
├─ odds (JSON - top 3 bookmakers)
├─ last_updated
└─ metadata (JSON)

TABLE: statistics
├─ id (UUID)
├─ team_id
├─ league
├─ season
├─ form (last 5 matches)
├─ xg (expected goals)
├─ possession
├─ shots_on_target
├─ clean_sheets
└─ last_updated

TABLE: standings
├─ id (UUID)
├─ league
├─ season
├─ rank
├─ team_id
├─ points
├─ goal_diff
├─ last_updated
```

### Optimisation

```
Avantages du Cache:
✅ Pas de surcharges API
✅ Temps de réponse < 100ms
✅ Zéro latence pour Claude
✅ Coûts API réduits de 80%+

Stratégie Update:
- Matches: Mis à jour chaque matin + en live
- Statistics: Mis à jour quotidiennement
- Standings: Mis à jour après chaque matchday
- Historical: Jamais invalidé
```

---

## 📦 MODULE 3: TICKET GENERATION SERVICE

### Mode A: Génération Automatique Quotidienne

```
CRON JOB: Chaque matin (08:00 UTC+1)
│
├─ 1. Récupère matches du jour (Supabase cache)
│
├─ 2. Pour chaque ticket type:
│     ├─ TICKET DU JOUR (Gratuit)
│     ├─ TICKET OPTIMUS (Comptes Optimisés)
│     ├─ TICKET MONTANT (Comptes Optimisés)
│     └─ TICKET PREMIUM (Premium subscribers)
│
├─ 3. Backend construit prompt pour Claude
│     └─ Données: matches + stats + règles métier
│
├─ 4. Claude API généère analyses
│     ├─ Analyse match par match
│     ├─ Calcul cotes + edge
│     ├─ Sélection finale
│     └─ Reasoning explicite
│
├─ 5. Store tickets in Supabase
│     ├─ ticket_id (UUID)
│     ├─ ticket_type (jour/optimus/montant/premium)
│     ├─ content (JSON - analyses)
│     ├─ generated_at
│     └─ valid_until (expiration)
│
└─ 6. Envoyer notifications
    ├─ Push notification
    ├─ WhatsApp (Community Manager)
    └─ Email (optional)

⚠️ IMPORTANT: Les tickets ne sont générés qu'UNE FOIS
   → Pas de recalcul itératif
   → Pas de volatilité
   → Performance stable et prévisible
```

### Mode B: Génération Personnalisée

```
User selects:
├─ Championnats (ex: Ligue 1, Premier League)
├─ Matches (ex: PSG vs Monaco)
└─ Risk level (Low/Medium/High)
        ↓
Backend:
├─ Récupère données sélectionnées de Supabase
├─ Construit prompt structuré
└─ Envoie à Claude
        ↓
Claude - STEP 1: Analyse indépendante
├─ Best bet pour chaque match
├─ Justification
└─ Confidence level
        ↓
Claude - STEP 2: Composition du combiné
├─ Respecte niveau risque
├─ Respecte nombre matchs
├─ Cible cote finale
└─ Optimise edge total
        ↓
Backend:
├─ Store ticket personnalisé
├─ Marquer comme "user_generated"
└─ Envoyer à utilisateur
        ↓
User:
├─ Reçoit ticket exact à sa demande
├─ Peut le sauvegarder
└─ Suivi statistiques séparé
```

### Structure Données Ticket (Supabase)

```sql
TABLE: tickets
├─ id (UUID)
├─ ticket_type (jour/optimus/montant/premium/custom)
├─ generated_at
├─ content (JSON)
│   ├─ selections (array)
│   │   ├─ match_id
│   │   ├─ selection
│   │   ├─ odds
│   │   ├─ edge
│   │   ├─ confidence
│   │   └─ reasoning
│   ├─ combined_odds
│   ├─ recommended_stake
│   └─ metadata
├─ created_by (system/user_id)
├─ valid_until (datetime)
└─ status (active/expired/archived)

TABLE: user_ticket_tracking
├─ id (UUID)
├─ user_id
├─ ticket_id
├─ user_placed_bet (boolean)
├─ match_results (array)
├─ outcome (win/loss/partial)
├─ tracked_at
```

---

## 📦 MODULE 4: ACCOUNT VERIFICATION SERVICE

### Problème Résolu

```
❌ AVANT:
Utilisateur dit: "J'ai créé un compte via ALGOPRONOS"
→ Comment vérifier? Mauel? Chatbot?

✅ APRÈS (Automated):
Utilisateur saisit son ID bookmaker
    ↓
Backend vérifie automatiquement vs Partner DB
    ↓
Activation instantanée si valide
    ↓
Access Full débloqué
```

### Architecture

```
┌──────────────────────────────────────────────────┐
│      ACCOUNT VERIFICATION SERVICE                │
├──────────────────────────────────────────────────┤
│                                                  │
│  User Flow:                                      │
│  1. User crée compte sur AlgoPronos App         │
│  2. User crée compte 1xBet via code ALGOPRONOS  │
│  3. User saisit son ID 1xBet dans AlgoPronos    │
│                         ↓                        │
│  ┌─────────────────────────────────────────┐   │
│  │ Verification Service                    │   │
│  │                                         │   │
│  │ 1. Extract bookmaker_id from user input │   │
│  │ 2. Query Partner Sync DB (Supabase)     │   │
│  │ 3. IF bookmaker_id found:               │   │
│  │    ├─ Cross-check email                 │   │
│  │    ├─ Cross-check phone                 │   │
│  │    └─ Mark as VERIFIED ✅               │   │
│  │ 4. ELSE:                                │   │
│  │    └─ Return error + instructions       │   │
│  └─────────────────────────────────────────┘   │
│                         ↓                        │
│  ┌─────────────────────────────────────────┐   │
│  │ Activate Features (Supabase Update)     │   │
│  │ ├─ account_status = VERIFIED            │   │
│  │ ├─ full_access = true                   │   │
│  │ ├─ ticket_optimus_access = true         │   │
│  │ └─ activated_at = now()                 │   │
│  └─────────────────────────────────────────┘   │
│                         ↓                        │
│  User App (Instant):                            │
│  ✅ Ticket Optimus débloqué                     │
│  ✅ Analyses Premium visibles                   │
│  ✅ Intégration WhatsApp groupe                 │
│  ✅ Dashboard complet accessible                │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Data Sync avec Partner DB

```sql
TABLE: partner_verified_accounts (Supabase)
├─ id (UUID)
├─ bookmaker_id (ex: 1xbet_user_12345)
├─ bookmaker_name (1xbet/other)
├─ user_email
├─ user_phone
├─ registered_date (at bookmaker)
├─ status (active/inactive)
├─ used_promo_code (ALGOPRONOS ✅)
├─ first_deposit (yes/no)
├─ deposit_amount
├─ deposit_date
├─ synced_at (timestamp)
└─ algopronos_verified (boolean)

TABLE: user_accounts (Supabase)
├─ id (UUID)
├─ email
├─ phone
├─ bookmaker_verification_status
├─ linked_bookmaker_id (FK to partner table)
├─ full_access_granted
├─ ticket_optimus_enabled
└─ verified_at
```

---

## 📦 MODULE 5: PARTNER SYNC ENGINE

### Architecture Indépendante

```
┌────────────────────────────────────────────────┐
│         PARTNER SYNC ENGINE                    │
├────────────────────────────────────────────────┤
│                                                │
│  Fonction:                                     │
│  Importer régulièrement les données du        │
│  programme partenaire (1xBet, etc.)           │
│                                                │
│  CRON JOB: Toutes les 6 heures                │
│                                                │
│  1. Se connecter à API Partenaire             │
│     └─ 1xBet Partner API (ou équivalent)      │
│                                                │
│  2. Récupérer nouvelles données:             │
│     ├─ Nouveaux utilisateurs via code        │
│     ├─ Comptes vérifiés                       │
│     ├─ Premiers dépôts                        │
│     └─ Transactions                           │
│                                                │
│  3. Transformer données                       │
│     ├─ Normaliser formats                     │
│     ├─ Valider intégrité                      │
│     └─ Mapper à schéma Supabase               │
│                                                │
│  4. Upsert dans Supabase                     │
│     └─ Mise à jour intelligente               │
│        (pas de perte de données)              │
│                                                │
│  5. Trigger downstream services               │
│     ├─ Account Verification Service           │
│     ├─ Commission Calculation                 │
│     └─ Notifications                          │
│                                                │
│  Scaling Strategy:                             │
│  └─ Service indépendant                       │
│     → Peut se connecter à plusieurs           │
│     → partenaires sans refonte                │
│     → Futur: Betfair, Unibet, etc.           │
│                                                │
└────────────────────────────────────────────────┘
```

### Données Synchronisées

```sql
TABLE: partner_accounts
├─ id (UUID)
├─ bookmaker_name
├─ bookmaker_account_id
├─ email
├─ phone
├─ first_name
├─ last_name
├─ country
├─ used_promo_code (ALGOPRONOS?)
├─ account_created_at
├─ first_deposit_at
├─ first_deposit_amount
├─ account_status (active/suspended)
├─ synced_at (last sync timestamp)
└─ metadata (JSON)

TABLE: partner_transactions
├─ id (UUID)
├─ bookmaker_account_id (FK)
├─ transaction_type (deposit/withdrawal/bet/loss)
├─ amount
├─ date
├─ synced_at
```

### Indépendance du Système

```
✅ Si 1xBet API down:
   → Autres services continuent
   → Sync retenté à la prochaine cron
   → Cache Supabase toujours disponible

✅ Si besoin d'ajouter Betfair:
   → Crée simplement nouveau connector
   → Pas besoin de refonte
   → Même schéma Supabase
   → Système modulaire par essence
```

---

## 📦 MODULE 6: WHATSAPP AUTOMATION

### Community Manager IA

```
┌──────────────────────────────────────────────────┐
│         WHATSAPP COMMUNITY MANAGER               │
├──────────────────────────────────────────────────┤
│                                                  │
│  Agent IA autonome gérant le groupe WhatsApp    │
│                                                  │
│  CRON JOBS:                                      │
│                                                  │
│  📍 08:00 - Ticket du Jour                      │
│  ├─ "Ticket Optimus du jour 🎯"                │
│  ├─ Match + Sélection + Cote                   │
│  ├─ Lien pour voir analyse complète            │
│  └─ Rappel de miser 2-3% bankroll              │
│                                                  │
│  📍 12:00 - Quick Analysis                      │
│  ├─ Analyse d'un match en vedette              │
│  ├─ Stats intéressants                         │
│  ├─ Questions community                        │
│  └─ Éducation paris sportifs                   │
│                                                  │
│  📍 17:00 - Premium Updates                     │
│  ├─ Annonce Ticket Premium                     │
│  └─ CTA vers abonnement                        │
│                                                  │
│  📍 20:00 - Resultat & Analysis                 │
│  ├─ Après les matchs                           │
│  ├─ Ticket result (gagnant/perdant)            │
│  ├─ Statistiques moyen                         │
│  └─ Motivation pour demain                     │
│                                                  │
│  📍 22:00 - Community Engagement               │
│  ├─ Questions/réponses                        │
│  ├─ Défis du jour                             │
│  ├─ Celebrations                              │
│  └─ Modération                                │
│                                                  │
│  Incoming Messages (Utilisateurs):              │
│  ├─ Questions techniques → Bot répond           │
│  ├─ Débats stratégie → Manager anime           │
│  ├─ Support requests → Escalade                │
│  └─ Spam/abuse → Auto-modération               │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Intégration Technique

```
WhatsApp API (Twilio/Meta)
        ↓
Backend Message Queue
        ↓
Natural Language Processing
        ↓
Claude (Response Generation)
        ↓
Message Formatting + Validation
        ↓
Send via WhatsApp API
        ↓
Log to Supabase (analytics)
```

### Autonomy Levels

```
Level 1: Scheduled Posts (100% Automated)
└─ Tickets, analyses, updates

Level 2: Q&A Bot (95% Automated)
├─ FAQ replies
├─ Ticket info requests
└─ Account status queries

Level 3: Community Animation (70% Human)
├─ Claude suggests responses
└─ Manager approves/edits

Level 4: Support Escalation (100% Human)
└─ Complex issues sent to team
```

---

## 📦 MODULE 7: DASHBOARD & USER INTERFACE

### Dashboard Data Model (Supabase)

```sql
TABLE: user_dashboard_data
├─ user_id (FK)
├─ account_status (active/pending/suspended)
├─ algopronos_verified (boolean)
├─ bookmaker_linked (boolean)
├─ linked_bookmaker (1xbet/other)
├─ full_access_enabled (boolean)
├─ premium_subscription (active/inactive)
├─ premium_expires_at
├─ whatsapp_joined (boolean)
│
├─ STATISTICS:
├─ tickets_followed (count)
├─ tickets_won (count)
├─ tickets_lost (count)
├─ win_rate (%)
├─ total_roi (%)
├─ month_roi (%)
├─ best_ticket (id + roi)
├─ worst_ticket (id + roi)
│
├─ BANKROLL:
├─ initial_deposit
├─ current_balance
├─ total_gain_loss
├─ roi_percentage
│
├─ PARTNERS (if applicable):
├─ referral_code
├─ referral_link
├─ filleuls_count
├─ filleuls_validated
├─ commission_earned
├─ commission_pending
├─ commission_withdrawn
│
├─ HISTORY:
├─ last_ticket_followed (date)
├─ last_deposit (date/amount)
├─ member_since (date)
└─ last_login (datetime)
```

### Frontend Displays

```
Dashboard View:

┌─────────────────────────────────┐
│ STATUS SECTION                  │
├─────────────────────────────────┤
│ ✅ Account Verified             │
│ ✅ Full Access Enabled          │
│ 🟡 Premium: Expires in 15 days  │
│ ✅ WhatsApp: Joined             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ QUICK STATS                     │
├─────────────────────────────────┤
│ Win Rate:        52%  📈        │
│ Month ROI:       +8.5% 🚀       │
│ Tickets Followed: 28            │
│ Current Streak:   3 wins        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ BANKROLL PROGRESS               │
├─────────────────────────────────┤
│ Initial:    50,000 XOF          │
│ Current:    54,250 XOF  📊      │
│ Gain:       +4,250 XOF          │
│ Graph: [visualization]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ PARTNERS (if active)            │
├─────────────────────────────────┤
│ Filleuls: 12 (8 validated)      │
│ Commissions: 2,000 XOF          │
│ Pending: 500 XOF                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ RECENT TICKETS                  │
├─────────────────────────────────┤
│ ✅ Jun 15: France vs Morocco    │
│ ❌ Jun 14: Brazil vs Senegal    │
│ ✅ Jun 13: Spain vs Sweden      │
│ [Load more...]                  │
└─────────────────────────────────┘
```

---

## 🔐 PRINCIPES ARCHITECTURAUX (Non-Négociables)

### Principe 1: APIs Externes Via Backend Uniquement

```
❌ JAMAIS:
Utilisateur → API Football
Utilisateur → API Bookmaker
Claude → API Externe directement

✅ TOUJOURS:
Utilisateur → Backend → API Externe
Backend → Supabase Cache → Claude
```

**Raison**:
- Sécurité (pas de clés API exposées)
- Performance (cache + batching)
- Coûts (une seule copie de données)
- Compliance (logs centralisés)

### Principe 2: Claude Raisonne Sur Données Préparées

```
❌ JAMAIS:
Claude reçoit raw API responses

✅ TOUJOURS:
Backend prépare données
    ↓
Backend construit prompt structuré
    ↓
Claude raisonne sur données nettoyées
```

**Exemple Prompt**:

```
Contexte:
- Match: France vs Morocco
- Date: 2026-06-20
- France form: W-W-W-D-L
- Morocco form: W-D-L-D-L

Données Caches:
- France avg goals scored: 2.3
- Morocco avg goals conceded: 1.1
- Head-to-head: France 3-0 (2020)

Odds 1xBet:
- France Gagne: 1.75 (implied: 57%)
- Over 2.5 Goals: 1.85 (implied: 54%)

Règles Métier:
- Edge minimum: +3%
- Kelly Criterion: 2-3% bankroll
- Confidence minimum: 70%

Task: Générer Ticket Optimus
```

### Principe 3: Chaque Module Indépendant

```
┌─────────────┐
│ Sales AI    │ ← Peut évoluer seul
└─────────────┘
      ↕
  (Supabase)
      ↕
┌─────────────────────────┐
│ Ticket Generation       │ ← Peut évoluer seul
└─────────────────────────┘
      ↕
  (Supabase)
      ↕
┌──────────────────┐
│ Partner Sync     │ ← Peut évoluer seul
└──────────────────┘
```

**Avantages**:
- A/B testing isolé par module
- Déploiement indépendant
- Rollback sans impact global
- Equipes peuvent travailler en parallèle

---

## 🚀 INFRASTRUCTURE & DEPLOYMENT

### Stack Technologique Recommandé

```
Frontend:
├─ Web: React 18 + TypeScript
├─ Mobile: React Native (expo)
└─ WhatsApp: Twilio SDK

Backend:
├─ Node.js (Express/NestJS)
├─ TypeScript
└─ API Gateway (Kong or custom)

Database:
├─ Supabase (PostgreSQL + Auth)
├─ Real-time: WebSocket subscriptions
└─ Caching: Redis (session + short-term)

IA & External:
├─ Claude API (analysis + responses)
├─ Football Data API (matches/stats)
├─ Twilio (WhatsApp)
├─ Firebase (push notifications)
└─ Sendgrid (email)

Deployment:
├─ Backend: Docker → AWS ECS
├─ Frontend: Vercel / Netlify
├─ Database: Supabase Cloud
└─ Monitoring: Sentry + DataDog
```

### Scaling Strategy

```
Phase 1 (0-1k users):
├─ Single backend instance
├─ Supabase Standard tier
└─ Cron jobs suffisent

Phase 2 (1k-10k users):
├─ Backend: 2-3 instances + load balancer
├─ Supabase: Upgraded tier
├─ Job queue: Bull (Redis)
└─ Caching: Redis instance

Phase 3 (10k+ users):
├─ Microservices per module
├─ Kubernetes orchestration
├─ Database sharding
├─ CDN global pour assets
└─ Multi-region deployment
```

---

## 📊 MONITORING & ANALYTICS

### Metrics À Tracker (Supabase + DataDog)

```
Backend Health:
├─ API response time (< 200ms target)
├─ Error rate (< 0.1% target)
├─ Database query time
└─ Cache hit rate (> 90% target)

Business Metrics:
├─ Utilisateurs actifs (DAU)
├─ Ticket conversion rate
├─ Win rate par ticket type
├─ ROI utilisateurs moyen
├─ Retention rate
├─ Partner commissions
└─ Revenue (subscriptions)

AI Performance:
├─ Claude API calls/day
├─ Cost per ticket generated
├─ Response quality (user feedback)
└─ Ticket accuracy (post-match analysis)

Partner Sync:
├─ Sync success rate (> 99.9%)
├─ Account verification time
├─ Commission calculation accuracy
└─ Last sync timestamp
```

---

## 🎯 OBJECTIF FINAL

```
❌ Construire un site de pronostics
✅ Construire une plateforme intelligente
   capable d'acquérir, convertir, fidéliser
   et monétiser ses utilisateurs
   avec maximum d'automatisation

Résultat:
├─ Croissance organique exponentiële
├─ CAC tend vers zéro
├─ Utilisateurs satisfaits → Ambassadeurs
└─ Écosystème autoalimenté
```

---

**Si cette architecture est respectée dès la V2,**
**elle évoluera progressivement sans refonte**
**quand le nombre d'utilisateurs augmentera.**

**Version**: 2.0 | **Status**: À Implémenter | **Next Review**: Août 2026

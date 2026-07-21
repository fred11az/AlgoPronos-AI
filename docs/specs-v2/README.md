# 📚 Specs AlgoPronos V2 + Sales AI — Point d'ancrage du projet

**Ce dossier contient la spécification complète de la V2 d'AlgoPronos et du Sales AI.**
C'est le point de référence pour toutes les sessions de travail (Claude Code inclus).

> **PRIORITÉ ACTUELLE : le Sales AI (MVP)** — voir la section "Plan MVP" ci-dessous.

---

## 📁 Les documents (ordre de lecture)

| # | Fichier | Contenu |
|---|---------|---------|
| 00 | `00-EXECUTIVE-SUMMARY.md` | Résumé une page — commencer ici |
| 01 | `01-INDEX-COMPLET.md` | Index détaillé de tous les documents |
| 02 | `02-BLUEPRINT-ACRG.md` | Vision ACQUIRE → CONVERT → RETAIN → GROW |
| 03 | `03-ARCHITECTURE-V2.md` | 7 modules backend + 3 principes non-négociables |
| 04 | `04-CERCLES-PRAGMATIQUE.md` | Stratégie de couverture sportive (3 cercles) |
| 05 | `05-SYNTHESE.md` | Vue d'ensemble de l'écosystème V2 |
| 06 | `06-API-FOOTBALL-CACHE.md` | Modèle de données + stratégie de cache |
| 07 | `07-COMMENT-TOUT-SEMBOITE.md` | Flow complet d'une journée (02:00 → 22:00) |
| 10 | `10-CAHIER-CHARGES-SALES-AI.md` | ⭐ **LA BIBLE du Sales AI** (8 missions, mémoire, outils, états) |
| 11 | `11-MISSIONS-COMMERCIALES-V2.md` | Clarification : missions commerciales ≠ objectifs techniques |
| 12 | `12-SKILL-SALES-AI.md` | Skill Sales AI (tunnel 10 étapes, objections, CRM) |
| 13 | `13-SKILL-TICKET-OPTIMUS.md` | Skill Ticket Optimus (moteur de rétention) |
| 14 | `14-SKILL-ALGOPRONOS-PARTNERS.md` | Skill Partners (affiliation, commissions 250 FCFA) |
| 20 | `20-CHECKLIST-FINALE.md` | Vérification de cohérence des documents |
| 21 | `21-INSTRUCTIONS-FINALES-FRED.md` | Plan d'exécution (briefing, sprints, mesure) |

---

## 🎯 Plan MVP Sales AI (validé par le conseiller)

**Ne PAS construire "le Sales AI complet" d'un coup.** Un seul parcours parfaitement huilé :

```
Prospect Facebook → conversation IA (Omari) → création/connexion AlgoPronos
→ présentation du Compte Optimisé IA → récupération de l'ID du compte
→ vérification → activation du statut → accompagnement
```

**Principe d'architecture clé** : Claude ne gère JAMAIS directement la base de données.
Claude décide qu'une action est nécessaire → le backend l'exécute → le backend renvoie
le résultat à Claude → Claude répond naturellement au prospect.

**Les 8 sprints** (cf. `10-CAHIER-CHARGES-SALES-AI.md`, Partie 15) :

1. Webhook Messenger + création utilisateur
2. Tables Supabase (prospects, conversations, mémoire)
3. Intégration Claude API + system prompt
4. Système de mémoire complet
5. Outils/actions (create_user, verify, activate…)
6. Vérification 1xBet → Full Access
7. Dashboard admin
8. WhatsApp + lancement

---

## 🏗️ État de l'existant (analyse du code, juillet 2026)

Le repo est une app **Next.js 14 (App Router) + Supabase + Claude API**, déjà en production
sur algopronos.com. Briques existantes réutilisables pour le Sales AI :

| Brique existante | Emplacement | Réutilisation Sales AI |
|------------------|-------------|------------------------|
| Profils utilisateurs + tiers (`premium`, `vip_lifetime`) | `supabase/migrations/001_initial_schema.sql` (`profiles`) | Rattachement prospect → profil |
| Vérifications bookmaker + trigger d'activation VIP auto | `vip_verifications` + trigger `activate_vip_after_approval` | Mission 7 (vérification automatique) |
| IDs bookmaker approuvés par admin | `admin_approved_bookmaker_ids` (migration 009) | Source de vérité vérification |
| Endpoint de vérification | `app/api/verify-account/route.ts` | Outil `verify_1xbet_account()` du Sales AI |
| Page Compte Optimisé IA | `app/compte-optimise-ia/` | Lien envoyé par le Sales AI (Mission 5) |
| Client Anthropic | `@anthropic-ai/sdk` (déjà en dépendance) | Cerveau du Sales AI |
| Cache Redis | `lib/services/redis-cache.ts` + Upstash | Rate limiting / cache conversations |
| Notifications | `lib/services/notification-service.ts`, `push.ts` | Relances |

**Conséquence** : le Sprint 1 se construit PAR-DESSUS l'existant, sans rien casser.
Il manque principalement : le webhook Messenger, les tables `prospects` / `conversations` /
`prospect_memory`, et le service Sales AI (boucle Claude + outils).

---

## ⚠️ Rappels non-négociables (pour chaque session de dev)

1. **Partie 2 du cahier des charges = 8 MISSIONS commerciales**, pas des objectifs techniques.
2. **Les 10 principes de philosophie de vente** guident chaque réponse d'Omari.
3. **La mémoire est LA clé** — un commercial se souvient de tout.
4. On dit **"Compte Optimisé IA"**, jamais "compte 1xBet".
5. Gains mentionnables honnêtement : **8-12% ROI/mois avec discipline**, jamais de promesse.
6. **Aucune fonctionnalité non spécifiée** — on suit les sprints, un à la fois.
7. Tester chaque sprint avec des conversations réelles avant de passer au suivant.

# Assistant de pari IA — Stratégie de cache & génération

## Objectif

Le bloc « Recommandation du jour » du dashboard (`components/dashboard/CoachRecommendationCard.tsx`)
génère un message de coach via l'**API Claude** (`claude-opus-4-8`) — sans jamais
régénérer à chaque chargement de page.

## Stratégie de cache

- **Clé** : `coach-reco:v1:{YYYY-MM-DD}:{cohorte}` dans la table Supabase existante `api_cache`.
- **Cohortes de risque** : `safe` / `balanced` / `risky` — déduites du dernier combiné
  généré par l'utilisateur (`generated_combines.parameters.riskLevel`), défaut `balanced`.
- **Fréquence** : 1 génération Claude **par jour et par cohorte**, soit **3 appels API
  maximum par jour** quel que soit le trafic. Le premier visiteur d'une cohorte paie
  la latence de génération (~2-5 s, la page reste fluide grâce à `<Suspense>`), tous
  les suivants lisent le cache.
- **Invalidation** : implicite par la clé datée — pas de purge nécessaire. Bump
  `CACHE_VERSION` dans `lib/services/coach-recommendation.ts` pour forcer une
  régénération globale (changement de prompt, de schéma…).
- **Fallback non mis en cache** : si l'appel Claude échoue (clé absente, réseau,
  rate-limit), des messages déterministes en français sont servis mais **pas mis en
  cache**, pour que la génération IA soit retentée au chargement suivant.

## Génération

- Données injectées dans le prompt : value bets du jour (`match_predictions` :
  cotes, probabilité modèle, probabilité implicite, value edge), pari « piège »
  éventuel (cote ≤ 1.35 sans edge positif), et cohorte de risque de l'utilisateur.
- Sortie **structurée** (`output_config.format` + schéma Zod) : `{ message, advice }`.
  Les matchs mis en avant et l'indicateur de confiance (★) sont calculés
  **déterministiquement** côté serveur — l'IA ne produit que le texte.
- Scénarios couverts : aucun value bet (message discipline/patience), 1-2 bons
  matchs, 3+ bons matchs (limiter aux meilleurs), avertissement cote trop faible.

## SSR / hydratation

Le composant est un **Server Component** (pas de `use client`, pas de `useEffect`) :
le message arrive dans le HTML initial, donc aucun risque du bug d'hydratation
« stats à 0 ». Il est enveloppé dans `<Suspense>` pour que le reste du dashboard
s'affiche sans attendre la génération lors d'un cache miss.

## Configuration requise

- `ANTHROPIC_API_KEY` doit être défini dans les variables d'environnement Vercel.
  Sans la clé, le bloc fonctionne en mode fallback (messages déterministes).

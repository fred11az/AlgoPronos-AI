# AlgoPronos AI

Une plateforme premium de génération automatique de combinés de paris sportifs pour l'Afrique de l'Ouest.

## Fonctionnalités

- Génération automatique de combinés sportifs par IA
- Système d'authentification complet avec vérification email
- Accès VIP gratuit via partenariat 1xBet
- Tableau de bord utilisateur
- Panel d'administration pour la vérification VIP
- Interface entièrement en français
- Design responsive mobile-first

## Stack technique

- **Frontend** : Next.js 14 (App Router)
- **Backend** : Supabase (Auth, Database, Storage)
- **Styling** : Tailwind CSS
- **Déploiement** : Vercel

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase

### Étapes

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-username/algopronos-ai.git
cd algopronos-ai
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env.local
```

4. Modifier `.env.local` avec vos clés Supabase :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=admin@algopronos.ai
```

5. Lancer le serveur de développement :
```bash
npm run dev
```

## Configuration Supabase

Voir le guide détaillé : [docs/SUPABASE_CONFIGURATION.md](docs/SUPABASE_CONFIGURATION.md)

### Configuration rapide

1. **Site URL** : Définir l'URL de production dans Supabase Dashboard > Authentication > URL Configuration

2. **Redirect URLs** : Ajouter :
   - `https://votre-domaine.com/**`
   - `http://localhost:3000/**` (développement)

3. **Templates Email** : Personnaliser les templates dans Authentication > Email Templates (voir documentation)

## Structure du projet

```
├── app/
│   ├── (auth)/           # Pages d'authentification
│   │   ├── login/        # Connexion
│   │   ├── register/     # Inscription
│   │   ├── verify-email/ # Vérification email
│   │   ├── forgot-password/ # Mot de passe oublié
│   │   └── reset-password/  # Réinitialisation
│   ├── auth/             # Callbacks Supabase
│   │   ├── callback/     # Route handler
│   │   ├── error/        # Page d'erreur
│   │   └── success/      # Page de succès
│   ├── dashboard/        # Espace utilisateur
│   ├── admin/            # Panel admin
│   └── unlock-vip/       # Activation VIP
├── components/           # Composants React
├── lib/
│   ├── supabase/         # Clients Supabase
│   └── services/         # Services métier
├── docs/                 # Documentation
└── types/                # Types TypeScript
```

## Flux d'authentification

1. **Inscription** → Page verify-email → Email de confirmation → Auth callback → Dashboard
2. **Connexion** → Vérification credentials → Dashboard
3. **Mot de passe oublié** → Email de reset → Auth callback → Reset password → Dashboard

## Déploiement

### Vercel

1. Connecter le dépôt GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer

### Variables d'environnement production

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
ADMIN_EMAILS
NEXT_PUBLIC_1XBET_PROMO_CODE
NEXT_PUBLIC_1XBET_AFFILIATE_URL
```

## Licence

Propriétaire - Tous droits réservés

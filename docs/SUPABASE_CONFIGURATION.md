# Configuration Supabase pour AlgoPronos AI

Ce guide détaille la configuration complète de Supabase pour le bon fonctionnement de l'authentification.

## Table des matières

1. [Configuration des URLs](#1-configuration-des-urls)
2. [Templates Email personnalisés](#2-templates-email-personnalisés)
3. [Paramètres d'authentification](#3-paramètres-dauthentification)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Vérification de la configuration](#5-vérification-de-la-configuration)

---

## 1. Configuration des URLs

### Accéder aux paramètres

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **URL Configuration**

### Site URL (URL du site)

Définissez l'URL de votre site en production :

```
https://votre-domaine.com
```

**Important** : Cette URL doit être l'URL de production, PAS `localhost:3000`

### Redirect URLs (URLs de redirection autorisées)

Ajoutez toutes les URLs autorisées pour les redirections après authentification :

```
https://votre-domaine.com/**
https://votre-domaine.com/auth/callback
https://votre-domaine.com/dashboard
https://votre-domaine.com/unlock-vip
```

**Pour le développement local**, ajoutez également :
```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

### Configuration recommandée

| Paramètre | Valeur Production | Valeur Développement |
|-----------|------------------|---------------------|
| Site URL | `https://votre-domaine.com` | `http://localhost:3000` |
| Redirect URLs | `https://votre-domaine.com/**` | `http://localhost:3000/**` |

---

## 2. Templates Email personnalisés

### Accéder aux templates

1. Dans Supabase Dashboard, allez dans **Authentication** → **Email Templates**

### Template : Confirmation d'inscription

**Subject** :
```
Confirmez votre inscription sur AlgoPronos AI
```

**Body** (HTML) :
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre email - AlgoPronos AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0;">
            🎯 AlgoPronos <span style="color: #00FF88;">AI</span>
          </h1>
        </div>

        <!-- Card -->
        <div style="background-color: #12121A; border-radius: 16px; padding: 40px; border: 1px solid #1E1E2E;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(0,255,136,0.2), rgba(138,43,226,0.2)); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px;">✉️</span>
            </div>
            <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 8px;">Bienvenue sur AlgoPronos AI !</h2>
            <p style="color: #8B8B9E; font-size: 16px; margin: 0;">Confirmez votre adresse email pour activer votre compte</p>
          </div>

          <!-- Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{ .ConfirmationURL }}"
               style="display: inline-block; background: linear-gradient(135deg, #00FF88, #00D4FF); color: #0A0A0F; font-weight: 600; font-size: 16px; padding: 16px 40px; border-radius: 12px; text-decoration: none;">
              Confirmer mon email
            </a>
          </div>

          <!-- Info -->
          <div style="background-color: #1E1E2E; border-radius: 12px; padding: 20px; margin-top: 24px;">
            <p style="color: #8B8B9E; font-size: 14px; margin: 0 0 12px;">
              <strong style="color: #FFFFFF;">Après confirmation :</strong>
            </p>
            <ul style="color: #8B8B9E; font-size: 14px; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Accédez à votre tableau de bord</li>
              <li style="margin-bottom: 8px;">Activez votre accès VIP gratuit avec 1xBet</li>
              <li>Recevez 2 combinés IA par jour</li>
            </ul>
          </div>

          <!-- Expiry notice -->
          <p style="color: #6B6B7E; font-size: 12px; text-align: center; margin-top: 24px;">
            Ce lien expire dans 24 heures. Si vous n'avez pas demandé cette inscription, ignorez cet email.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #6B6B7E; font-size: 12px; margin: 0;">
            © 2024 AlgoPronos AI - L'IA la plus avancée pour vos paris sportifs
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template : Réinitialisation de mot de passe

**Subject** :
```
Réinitialisez votre mot de passe - AlgoPronos AI
```

**Body** (HTML) :
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe - AlgoPronos AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0;">
            🎯 AlgoPronos <span style="color: #00FF88;">AI</span>
          </h1>
        </div>

        <!-- Card -->
        <div style="background-color: #12121A; border-radius: 16px; padding: 40px; border: 1px solid #1E1E2E;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(255,193,7,0.2), rgba(255,87,34,0.2)); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px;">🔐</span>
            </div>
            <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 8px;">Réinitialisation de mot de passe</h2>
            <p style="color: #8B8B9E; font-size: 16px; margin: 0;">Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe</p>
          </div>

          <!-- Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{ .ConfirmationURL }}"
               style="display: inline-block; background: linear-gradient(135deg, #00FF88, #00D4FF); color: #0A0A0F; font-weight: 600; font-size: 16px; padding: 16px 40px; border-radius: 12px; text-decoration: none;">
              Réinitialiser mon mot de passe
            </a>
          </div>

          <!-- Security notice -->
          <div style="background-color: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); border-radius: 12px; padding: 16px; margin-top: 24px;">
            <p style="color: #FFC107; font-size: 14px; margin: 0;">
              ⚠️ <strong>Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, votre compte est peut-être compromis. Contactez notre support immédiatement.
            </p>
          </div>

          <!-- Expiry notice -->
          <p style="color: #6B6B7E; font-size: 12px; text-align: center; margin-top: 24px;">
            Ce lien expire dans 24 heures.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #6B6B7E; font-size: 12px; margin: 0;">
            © 2024 AlgoPronos AI - L'IA la plus avancée pour vos paris sportifs
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template : Magic Link (optionnel)

**Subject** :
```
Votre lien de connexion - AlgoPronos AI
```

**Body** (HTML) :
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion - AlgoPronos AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0;">
            🎯 AlgoPronos <span style="color: #00FF88;">AI</span>
          </h1>
        </div>

        <!-- Card -->
        <div style="background-color: #12121A; border-radius: 16px; padding: 40px; border: 1px solid #1E1E2E;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 8px;">Connexion rapide</h2>
            <p style="color: #8B8B9E; font-size: 16px; margin: 0;">Cliquez pour vous connecter instantanément</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="{{ .ConfirmationURL }}"
               style="display: inline-block; background: linear-gradient(135deg, #00FF88, #00D4FF); color: #0A0A0F; font-weight: 600; font-size: 16px; padding: 16px 40px; border-radius: 12px; text-decoration: none;">
              Me connecter
            </a>
          </div>

          <p style="color: #6B6B7E; font-size: 12px; text-align: center; margin-top: 24px;">
            Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois.
          </p>
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #6B6B7E; font-size: 12px; margin: 0;">
            © 2024 AlgoPronos AI
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Paramètres d'authentification

### Accéder aux paramètres

1. Dans Supabase Dashboard → **Authentication** → **Providers**
2. Puis **Authentication** → **Settings**

### Paramètres recommandés

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Enable email confirmations | ✅ Activé | Requiert vérification email |
| Double confirm email changes | ✅ Activé | Sécurité supplémentaire |
| Enable email provider | ✅ Activé | Permet connexion par email |
| Minimum password length | 6 | Longueur minimale du mot de passe |
| JWT expiry | 3600 | Durée de session en secondes |

### Configuration du provider Email

Dans **Authentication** → **Providers** → **Email** :

- **Confirm email** : Activé
- **Secure email change** : Activé
- **Secure password change** : Activé

---

## 4. Variables d'environnement

### Fichier `.env.local`

Créez ou modifiez le fichier `.env.local` à la racine du projet :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# App Configuration
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NEXT_PUBLIC_APP_NAME=AlgoPronos AI

# Admin (emails séparés par des virgules)
ADMIN_EMAILS=admin@algopronos.ai

# 1xBet Affiliate
NEXT_PUBLIC_1XBET_PROMO_CODE=ALGOPRONO2025
NEXT_PUBLIC_1XBET_AFFILIATE_URL=https://refpa58144.com/...
```

### Obtenir les clés Supabase

1. Dans Supabase Dashboard → **Settings** → **API**
2. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **ATTENTION** : Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client !

---

## 5. Vérification de la configuration

### Checklist de configuration

- [ ] Site URL configuré avec l'URL de production
- [ ] Redirect URLs incluent `/auth/callback`
- [ ] Templates email personnalisés en français
- [ ] Variables d'environnement configurées
- [ ] Email confirmation activée
- [ ] Provider email activé

### Test du flux complet

1. **Inscription** :
   - Créer un compte → Vérifier redirection vers `/verify-email`
   - Vérifier réception de l'email personnalisé

2. **Confirmation email** :
   - Cliquer sur le lien dans l'email
   - Vérifier redirection vers `/auth/success` puis `/dashboard`

3. **Connexion** :
   - Se connecter avec le compte vérifié
   - Vérifier accès au dashboard

4. **Réinitialisation mot de passe** :
   - Demander une réinitialisation
   - Vérifier email reçu
   - Définir nouveau mot de passe
   - Vérifier connexion avec nouveau mot de passe

### Résolution des problèmes courants

#### "Email link is invalid or has expired"
- Vérifiez que le Site URL est correct dans Supabase
- Vérifiez que l'URL de redirection est dans la liste autorisée
- Le lien a peut-être expiré (24h de validité)

#### Les emails ne sont pas reçus
- Vérifiez le dossier spam
- Vérifiez que Supabase n'est pas en rate limit
- Utilisez un service SMTP personnalisé pour la production

#### Redirection vers localhost en production
- Vérifiez `NEXT_PUBLIC_APP_URL` dans les variables d'environnement
- Vérifiez le Site URL dans Supabase Dashboard
- Redéployez après modification des variables

---

## Support

Pour toute question ou problème :
- Documentation Supabase : https://supabase.com/docs
- Support AlgoPronos : support@algopronos.ai

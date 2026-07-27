# 📧 Délivrabilité — pourquoi nos emails tombaient dans « Promotions »

**Contexte** : les emails AlgoPronos (activation Full Access, confirmation, résultats de
ticket, campagnes) arrivaient dans l'onglet *Promotions* de Gmail au lieu de la boîte
principale. Ce document explique les causes réelles, ce qui a été corrigé dans le code, et
ce qui reste à faire côté DNS / Resend — car la moitié du problème ne se règle pas en code.

---

## 1. Comment Gmail décide de l'onglet

Gmail ne lit pas « l'intention » d'un email. Il applique un classifieur qui pèse des
signaux structurels. Par ordre d'impact réel :

| Signal | Effet | Notre cas avant correction |
|--------|-------|----------------------------|
| En-tête `List-Unsubscribe` | **Marqueur n°1 de courrier de masse** → Promotions | ❌ Présent sur l'activation de compte, le refus, la suspension, les résultats de ticket |
| Réputation du domaine d'envoi | Un domaine qui envoie du marketing voit **tout** son courrier classé promotionnel | ❌ Un seul domaine pour les OTP **et** les campagnes |
| Structure HTML | Dégradés, gros bouton coloré, images pleine largeur = design promotionnel | ❌ Bandeau `linear-gradient` + bouton dégradé sur les emails transactionnels |
| Pied de page marketing | « Gérer mes préférences », « Se désinscrire » | ❌ Présent sur les emails d'activation |
| Objet | Emojis, `|`, mots promotionnels (« gratuitement », « débloquez ») | ❌ `✅ Votre adresse email est confirmée \| AlgoPronos AI` |
| Réécriture des liens (tracking) | Les liens pointent vers un domaine tiers = signal marketing fort | ⚠️ À vérifier dans Resend |
| Absence de version texte | Signal négatif | ⚠️ Manquait sur plusieurs envois |

**Le point non négociable** : l'email OTP (`app/api/auth/send-email/route.ts`) était déjà
sobre (fond blanc, pas de dégradé, pas de `List-Unsubscribe`) — c'est précisément pour ça
qu'il se comportait mieux que les autres. La correction consiste à **aligner tout le
transactionnel sur ce modèle**.

---

## 2. Ce qui a été corrigé dans le code

### Séparation stricte des deux flux — `lib/services/email/client.ts`

Trois fonctions, et le flux impose l'en-tête et l'expéditeur :

| Fonction | Usage | `List-Unsubscribe` | Domaine |
|----------|-------|--------------------|---------|
| `sendTransactional()` | OTP, confirmation email, activation / refus / suspension Full Access, statut MobCash, résultat de ticket | **jamais** | transactionnel |
| `sendMarketing()` | Campagnes admin, invitation à l'upgrade | **toujours** (+ `List-Unsubscribe-Post` un clic) | marketing |
| `sendInternal()` | Alertes admin | jamais | transactionnel |

Plus aucun `resend.emails.send()` direct ailleurs dans le code : impossible de reposer
l'en-tête par accident.

### Gabarit transactionnel sobre — `lib/services/email/layout.ts`

Fond blanc, bouton en aplat, pas de dégradé, pas de pied de page marketing, texte d'aperçu
(`preview text`) explicite. Appliqué à l'activation, au refus, à la suspension et à la
confirmation d'email.

### Objets nettoyés

- `✅ Votre adresse email est confirmée | AlgoPronos AI` → `Votre adresse email est confirmée`
- `✅ Ticket GAGNÉ — Ticket du 21/07/2026 | AlgoPronos AI` → `Ticket gagné — votre ticket du 21/07/2026`
- `✅ Votre dépôt de 10 000 FCFA a été traité | MobCash` → `Votre dépôt de 10 000 FCFA a été traité`

### Désabonnement réel

`List-Unsubscribe` n'est plus décoratif : `/api/email/unsubscribe` (GET + POST un clic)
écrit dans `profiles.marketing_opt_out` et `email_opt_outs`, et les campagnes filtrent
dessus. Migration : `supabase/migrations/20260721_email_marketing_opt_out.sql`.

### Version texte systématique

Toutes les campagnes et notifications ont désormais une alternative texte.

---

## 3. Ce qui reste à faire — DNS & Resend (⚠️ le plus important)

Le code ne peut pas réparer une réputation de domaine. **Ces étapes sont indispensables**,
sinon les corrections ci-dessus n'auront qu'un effet partiel.

### Étape 1 — Créer un second domaine d'envoi dans Resend

Dans le tableau de bord Resend → **Domains** :

| Domaine | Rôle | Suivi ouverture/clic |
|---------|------|----------------------|
| `algopronos.com` | Transactionnel (OTP, activation, MobCash) | **DÉSACTIVÉ** |
| `mail.algopronos.com` | Marketing (campagnes) | Activé si besoin |

> Le suivi réécrit les liens vers un domaine tiers — c'est un marqueur promotionnel fort.
> Le désactiver sur le transactionnel est un gain direct.

### Étape 2 — Publier les enregistrements DNS des deux domaines

Resend fournit les valeurs exactes (SPF + DKIM). Ajouter en plus **DMARC**, qui manque
souvent et pèse lourd dans la réputation :

```
Type: TXT
Nom:  _dmarc.algopronos.com
Valeur: v=DMARC1; p=none; rua=mailto:dmarc@algopronos.com; adkim=s; aspf=s
```

Commencer en `p=none` (observation), puis passer à `p=quarantine` après quelques semaines
de rapports propres.

### Étape 3 — Renseigner les variables d'environnement

```
RESEND_TRANSACTIONAL_FROM=AlgoPronos AI <no-reply@algopronos.com>
RESEND_MARKETING_FROM=AlgoPronos AI <news@mail.algopronos.com>
```

### Étape 4 — Rendre `support@algopronos.com` réellement joignable

Tous les emails transactionnels ont ce `Reply-To`. Une adresse de réponse qui rebondit
dégrade la réputation ; une boîte qui reçoit de vraies réponses l'améliore.

---

## 4. Attentes réalistes — à lire avant de juger le résultat

**Le transactionnel peut et doit atteindre la boîte principale.** Codes OTP, activation de
compte, statut d'un dépôt : après séparation des domaines et suppression de
`List-Unsubscribe`, c'est le comportement attendu.

**Les campagnes marketing resteront majoritairement en Promotions, et c'est normal.**
L'onglet Promotions existe exactement pour ça. Trois précisions importantes :

1. **Retirer `List-Unsubscribe` des campagnes pour forcer la boîte principale serait une
   erreur grave.** Depuis février 2024, Gmail l'exige des expéditeurs de volume. L'omettre
   ne fait pas passer en Principale : ça fait passer en **spam**, ce qui est bien pire.
2. Promotions n'est pas spam : l'email est délivré, consultable et cherchable.
3. Ce qui déplace durablement un expéditeur vers la boîte principale, c'est **l'engagement**
   des destinataires (ouvertures, réponses, mises en favori) — pas une astuce technique.

**Délai** : la réputation Gmail se recalcule sur plusieurs jours à quelques semaines. Ne pas
juger sur un seul email envoyé le jour du déploiement.

---

## 5. Vérifier que ça marche

1. **[mail-tester.com](https://www.mail-tester.com)** — envoyer un OTP et une campagne à
   l'adresse fournie. Viser 9/10 ou 10/10 pour le transactionnel.
2. **Google Postmaster Tools** — ajouter `algopronos.com` et `mail.algopronos.com` pour
   suivre réputation, taux de spam et authentification.
3. **Test manuel** — un compte Gmail neuf, faire une inscription complète, vérifier
   l'onglet d'arrivée de chaque email du parcours.
4. **Dans Gmail, « Afficher l'original »** — confirmer `SPF: PASS`, `DKIM: PASS`,
   `DMARC: PASS`, et l'absence de `List-Unsubscribe` sur un email transactionnel.

---

## 6. Règle à retenir pour la suite

> Avant d'ajouter un email, se demander : **l'utilisateur l'a-t-il déclenché et l'attend-il ?**
>
> - Oui → `sendTransactional()`, gabarit sobre, objet factuel, aucun désabonnement.
> - Non → `sendMarketing()`, désabonnement obligatoire, domaine marketing.
>
> Un email de prospection envoyé sur le flux transactionnel contamine les codes OTP de
> tous les utilisateurs. C'est exactement ce qui s'était produit ici.

/**
 * ============================================================
 *  AlgoPronos AI — Google Indexing API Script
 *  Protocole d'Indexation Forcée (Instant Indexing)
 * ============================================================
 *
 *  OBJECTIF : Notifier Google immédiatement de chaque nouvelle
 *  URL pour qu'elle soit crawlée et indexée en moins de 24h,
 *  au lieu d'attendre plusieurs semaines.
 *
 *  DOCUMENTATION OFFICIELLE :
 *  https://developers.google.com/search/apis/indexing-api/v3/quickstart
 *
 * ============================================================
 *  PRÉREQUIS — INSTALLATION
 * ============================================================
 *
 *  1. Installer la dépendance :
 *     npm install google-auth-library
 *     (ou : yarn add google-auth-library)
 *
 *  2. Google Search Console → Paramètres → Propriétaire → Ajouter un utilisateur
 *     avec l'email du service account (étape 3 ci-dessous)
 *
 *  3. Google Cloud Console (console.cloud.google.com) :
 *     a) Créer un projet (ou utiliser un existant)
 *     b) Activer l'API "Indexing API" dans "Bibliothèque d'API"
 *     c) Créer un Compte de Service :
 *        IAM et admin → Comptes de service → Créer
 *        Télécharger la clé JSON → nommer "service-account.json"
 *     d) Placer "service-account.json" dans /scripts/
 *
 *  4. Dans Google Search Console :
 *     Paramètres → Utilisateurs et autorisations → Ajouter un utilisateur
 *     Coller l'email du service account (client_email dans le JSON)
 *     Rôle : Propriétaire
 *
 * ============================================================
 *  UTILISATION
 * ============================================================
 *
 *  # Toutes les URLs (lancement complet)
 *  node scripts/google-indexing.mjs
 *
 *  # Nouvelles pages uniquement (Data Science + autres-liens)
 *  node scripts/google-indexing.mjs --new
 *
 *  # Une URL spécifique
 *  node scripts/google-indexing.mjs --url https://algopronos.com/data-analysis-multipliers
 *
 *  # Notifier une suppression d'URL
 *  node scripts/google-indexing.mjs --delete --url https://algopronos.com/ancienne-page
 *
 * ============================================================
 */

import { readFileSync, existsSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';
import { parseArgs } from 'util';
import { join, dirname } from 'path';

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL    = 'https://algopronos.com';
const API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
import { fileURLToPath } from 'url';
const KEY_FILE    = fileURLToPath(new URL('./service-account.json', import.meta.url));
const __dirname   = dirname(fileURLToPath(import.meta.url));

// Délai entre chaque requête (ms) — respecter les quotas Google (200 req/jour)
const BATCH_DELAY_MS = 200;

// ─── Lecture .env ──────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  const envLocalPath = join(__dirname, '..', '.env.local');
  const file = existsSync(envLocalPath) ? envLocalPath : existsSync(envPath) ? envPath : null;
  if (!file) return {};
  const vars = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) vars[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

// ─── Fetch pages dynamiques depuis Supabase ───────────────────────────────────

async function fetchDynamicUrls(env) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { urls: [], error: 'Variables NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes dans .env' };
  }

  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
  const today   = new Date().toISOString().split('T')[0];
  const urls    = [];

  // Pronostics de matchs
  const matchRes = await fetch(
    `${supabaseUrl}/rest/v1/match_predictions?select=slug&match_date=gte.${today}&limit=500`,
    { headers }
  );
  if (matchRes.ok) {
    const matches = await matchRes.json();
    for (const m of matches) {
      if (m.slug) urls.push({ url: `${BASE_URL}/pronostic/${m.slug}`, priority: 'DYN' });
    }
  }

  // Pages de ligues
  const leagueRes = await fetch(
    `${supabaseUrl}/rest/v1/match_predictions?select=league_slug&match_date=gte.${today}`,
    { headers }
  );
  if (leagueRes.ok) {
    const leagues = await leagueRes.json();
    const unique  = [...new Set(leagues.map(l => l.league_slug).filter(Boolean))];
    for (const slug of unique) urls.push({ url: `${BASE_URL}/ligue/${slug}`, priority: 'DYN' });
  }

  // Pages d'équipes
  const homeRes = await fetch(
    `${supabaseUrl}/rest/v1/match_predictions?select=home_team_slug,away_team_slug&match_date=gte.${today}`,
    { headers }
  );
  if (homeRes.ok) {
    const teams  = await homeRes.json();
    const unique = [...new Set([
      ...teams.map(t => t.home_team_slug),
      ...teams.map(t => t.away_team_slug),
    ].filter(Boolean))];
    for (const slug of unique) urls.push({ url: `${BASE_URL}/equipe/${slug}`, priority: 'DYN' });
  }

  // Grandes affiches
  const spotRes = await fetch(
    `${supabaseUrl}/rest/v1/weekly_spotlights?select=slug&limit=100&order=created_at.desc`,
    { headers }
  );
  if (spotRes.ok) {
    const spots = await spotRes.json();
    for (const s of spots) {
      if (s.slug) urls.push({ url: `${BASE_URL}/grandes-affiches/${s.slug}`, priority: 'DYN' });
    }
  }

  return { urls, error: null };
}

// ─── URLs à indexer — toutes les pages statiques ──────────────────────────────

const ALL_URLS = [
  // ── Pages prioritaires (score fort)
  { url: `${BASE_URL}/`,                                    priority: 'HIGH' },
  { url: `${BASE_URL}/pronostics`,                          priority: 'HIGH' },
  { url: `${BASE_URL}/compte-optimise-ia`,                  priority: 'HIGH' },
  { url: `${BASE_URL}/code-promo-1xbet`,                    priority: 'HIGH' },
  { url: `${BASE_URL}/matchs`,                              priority: 'HIGH' },

  // ── Nouvelles pages Data Science (priorité immédiate)
  { url: `${BASE_URL}/data-analysis-multipliers`,           priority: 'NEW'  },
  { url: `${BASE_URL}/probability-optimization-models`,     priority: 'NEW'  },

  // ── Pages SEO existantes
  { url: `${BASE_URL}/grandes-affiches`,                    priority: 'MED'  },
  { url: `${BASE_URL}/algorithme-pronostic-foot`,           priority: 'MED'  },
  { url: `${BASE_URL}/avis-algopronos`,                     priority: 'MED'  },
  { url: `${BASE_URL}/classement`,                          priority: 'MED'  },
  { url: `${BASE_URL}/verificateur-compte`,                 priority: 'MED'  },
  { url: `${BASE_URL}/ancien-code-promo-1xbet`,             priority: 'MED'  },
  { url: `${BASE_URL}/retrait-1xbet-orange-money`,          priority: 'MED'  },
  { url: `${BASE_URL}/code-promo-1xbet-benin-ci-sn`,        priority: 'MED'  },
  { url: `${BASE_URL}/autres-liens`,                        priority: 'MED'  },

  // ── Pages 1xBet par pays (Afrique)
  { url: `${BASE_URL}/1xbet/benin`,                         priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/cote-divoire`,                  priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/senegal`,                       priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/cameroun`,                      priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/mali`,                          priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/togo`,                          priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/burkina-faso`,                  priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/niger`,                         priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/congo`,                         priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/gabon`,                         priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/guinee`,                        priority: 'MED'  },
  { url: `${BASE_URL}/1xbet/madagascar`,                    priority: 'MED'  },
];

// URLs nouvelles uniquement (pour le flag --new)
const NEW_URLS = ALL_URLS.filter(u => u.priority === 'NEW');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(emoji, msg, color = '\x1b[0m') {
  console.log(`${color}${emoji}  ${msg}\x1b[0m`);
}

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Parse CLI args
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      new:     { type: 'boolean', default: false },
      delete:  { type: 'boolean', default: false },
      dynamic: { type: 'boolean', default: false },
      url:     { type: 'string'  },
    },
    allowPositionals: true,
  });

  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════${'\x1b[0m'}`);
  console.log(`${BOLD}${CYAN}  AlgoPronos AI — Google Indexing API             ${'\x1b[0m'}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════${'\x1b[0m'}\n`);

  // Determine URL list
  let targets;
  if (values.url) {
    targets = [{ url: values.url, priority: 'MANUAL' }];
  } else if (values.new) {
    targets = NEW_URLS;
    log('🆕', `Mode --new : ${targets.length} nouvelles URLs ciblées`, YELLOW);
  } else if (values.dynamic) {
    log('🌐', `Mode --dynamic : récupération des pages dynamiques depuis Supabase…`, CYAN);
    const env = loadEnv();
    const { urls, error } = await fetchDynamicUrls(env);
    if (error) {
      log('❌', error, RED);
      process.exit(1);
    }
    targets = [...ALL_URLS, ...urls];
    log('📋', `Total : ${ALL_URLS.length} pages statiques + ${urls.length} pages dynamiques = ${targets.length} URLs`, CYAN);
  } else {
    targets = ALL_URLS;
    log('📋', `Mode complet : ${targets.length} URLs statiques`, CYAN);
    log('💡', `Astuce : utilisez --dynamic pour inclure aussi les pages de matchs/ligues/équipes`, YELLOW);
  }

  const notificationType = values.delete ? 'URL_DELETED' : 'URL_UPDATED';
  log(values.delete ? '🗑️' : '📡', `Type : ${notificationType}`, YELLOW);
  console.log();

  // Load service account credentials
  let auth;
  try {
    const keyData = JSON.parse(readFileSync(KEY_FILE, 'utf8'));
    auth = new GoogleAuth({
      credentials: keyData,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });
    log('🔑', `Service account : ${keyData.client_email}`, GREEN);
  } catch (err) {
    log('❌', `Fichier service-account.json introuvable dans /scripts/`, RED);
    log('📖', 'Consultez les instructions en haut du script.', YELLOW);
    process.exit(1);
  }

  const client = await auth.getClient();

  // Stats
  let success = 0;
  let failed  = 0;

  console.log();
  log('🚀', `Démarrage de l'envoi vers Google Indexing API…\n`, BOLD);

  for (let i = 0; i < targets.length; i++) {
    const { url, priority } = targets[i];
    const label = `[${String(i + 1).padStart(2, '0')}/${targets.length}]`;

    try {
      const res = await client.request({
        url:    API_ENDPOINT,
        method: 'POST',
        data:   { url, type: notificationType },
      });

      const status  = res.status;
      const latency = res.data?.urlNotificationMetadata?.latestUpdate?.notifyTime;

      if (status === 200) {
        log('✅', `${label} ${url}`, GREEN);
        success++;
      } else {
        log('⚠️', `${label} HTTP ${status} — ${url}`, YELLOW);
        failed++;
      }
    } catch (err) {
      const code = err?.response?.status ?? '???';
      const msg  = err?.response?.data?.error?.message ?? err.message ?? 'Unknown error';
      log('❌', `${label} [${code}] ${url} — ${msg}`, RED);
      failed++;
    }

    // Respect rate limit (200 req/day quota = ~1 req/7 min for all-day runs)
    // For burst mode, 200ms between requests is fine for short batches.
    if (i < targets.length - 1) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Summary
  console.log();
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════${'\x1b[0m'}`);
  log('📊', `Terminé : ${success} succès · ${failed} erreurs / ${targets.length} total`);
  log('⏱️', `Délai d'indexation estimé : 24–48h`);

  if (failed === 0) {
    log('🎉', `Toutes les URLs ont été notifiées à Google !`, GREEN);
  } else {
    log('⚠️', `${failed} URL(s) en échec — relancer avec --url pour les corriger`, YELLOW);
  }

  console.log();
  log('📌', 'Prochaine étape : vérifier l\'indexation via Google Search Console');
  log('🔗', 'https://search.google.com/search-console/index');
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════${'\x1b[0m'}\n`);
}

main().catch(err => {
  console.error('\x1b[31m❌ Erreur fatale :\x1b[0m', err.message);
  process.exit(1);
});

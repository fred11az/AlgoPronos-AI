/**
 * Ticket Resolution — logique pure de résolution des tickets quotidiens.
 *
 * Extraite de app/api/cron/resolve-tickets/route.ts pour être testable
 * indépendamment (voir scripts/test-resolve-logic.ts).
 *
 * Contexte bug corrigé (juillet 2026) :
 * Les tickets stockent des matchId au format slug ("arsenal-vs-chelsea-2026-07-10")
 * ou préfixé ("apif-123", "odds-abc", "1xbet-456") alors que les scores The Odds API
 * sont indexés par event id brut. Le lookup échouait donc toujours → chaque pick
 * passait en "void" dès J+1 → ticket "ANNULÉ" + email de masse à tous les profils.
 * La résolution matche désormais aussi par noms d'équipes normalisés, le void
 * n'intervient qu'après VOID_AFTER_DAYS jours, et un ticket void ne déclenche
 * plus AUCUNE notification utilisateur.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScoreResult = { homeGoals: number; awayGoals: number; finished: boolean };

/** Index des scores : par event id (avec variantes préfixées) et par paire d'équipes. */
export interface ScoreIndex {
  byId: Map<string, ScoreResult>;
  byTeams: Map<string, ScoreResult>;
}

export interface TicketPick {
  matchId?: string;
  homeTeam: string;
  awayTeam: string;
  selection: { type: string; value: string; odds: number };
  [key: string]: unknown;
}

export type PickResult = 'won' | 'lost' | 'void' | 'pending';
export type TicketStatus = 'won' | 'lost' | 'void' | 'pending';

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Nombre de jours après la date du ticket avant d'accepter un "void".
 * Avant ce délai, un score introuvable = "pending" (on réessaie le lendemain).
 * Ancienne valeur implicite : 1 jour → void quasi systématique (bug).
 */
export const VOID_AFTER_DAYS = 3;

// ─── Normalisation équipes ────────────────────────────────────────────────────

/** "Séville FC" → "sevillefc" — insensible aux accents, casse et ponctuation. */
export function normalizeTeamName(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function teamPairKey(home: string, away: string): string {
  return `${normalizeTeamName(home)}|${normalizeTeamName(away)}`;
}

// ─── Évaluation d'un pick ─────────────────────────────────────────────────────

export function evaluatePick(
  type: string,
  value: string,
  homeGoals: number,
  awayGoals: number,
): boolean {
  if (type === '1X2') {
    if (value === '1') return homeGoals > awayGoals;
    if (value === 'X') return homeGoals === awayGoals;
    if (value === '2') return awayGoals > homeGoals;
  }
  if (type === 'Double Chance') {
    if (value === '1X') return homeGoals >= awayGoals;
    if (value === 'X2') return awayGoals >= homeGoals;
    if (value === '12') return homeGoals !== awayGoals;
  }
  if (type === 'BTTS') {
    const btts = homeGoals > 0 && awayGoals > 0;
    if (value === 'Oui' || value === 'Yes') return btts;
    if (value === 'Non' || value === 'No') return !btts;
  }
  if (type === 'Over/Under') {
    const total = homeGoals + awayGoals;
    const m = value.match(/^(Over|Under)\s+([\d.]+)$/);
    if (m) {
      const threshold = parseFloat(m[2]);
      return m[1] === 'Over' ? total > threshold : total <= threshold;
    }
  }
  return false;
}

// ─── Lookup du score d'un pick ────────────────────────────────────────────────

/**
 * Retrouve le score d'un pick en essayant, dans l'ordre :
 * 1. matchId brut (event id The Odds API)
 * 2. matchId sans préfixe interne ("odds-", "apif-", "1xbet-")
 * 3. paire d'équipes normalisée (couvre les matchId au format slug)
 */
export function findScoreForPick(pick: TicketPick, index: ScoreIndex): ScoreResult | null {
  const id = pick.matchId || '';

  if (id && index.byId.has(id)) return index.byId.get(id)!;

  const unprefixed = id.replace(/^(odds-|apif-|1xbet-)/, '');
  if (unprefixed && unprefixed !== id && index.byId.has(unprefixed)) {
    return index.byId.get(unprefixed)!;
  }

  const byTeams = index.byTeams.get(teamPairKey(pick.homeTeam, pick.awayTeam));
  return byTeams ?? null;
}

// ─── Résolution d'un ticket complet ───────────────────────────────────────────

export interface TicketResolution {
  status: TicketStatus;
  enrichedMatches: (TicketPick & { result: PickResult; score: { home: number; away: number } | null })[];
  /** Raison lisible pour les logs. */
  reason: string;
}

export function resolveTicketMatches(
  matches: TicketPick[],
  index: ScoreIndex,
  ticketAgeDays: number,
): TicketResolution {
  let anyLost = false;
  let anyVoid = false;
  let anyPending = false;

  const enrichedMatches = matches.map((m) => {
    const score = findScoreForPick(m, index);

    if (!score || !score.finished) {
      if (ticketAgeDays < VOID_AFTER_DAYS) {
        anyPending = true;
        return { ...m, result: 'pending' as PickResult, score: null };
      }
      anyVoid = true;
      return { ...m, result: 'void' as PickResult, score: null };
    }

    const won = evaluatePick(m.selection.type, m.selection.value, score.homeGoals, score.awayGoals);
    if (!won) anyLost = true;
    return {
      ...m,
      result: (won ? 'won' : 'lost') as PickResult,
      score: { home: score.homeGoals, away: score.awayGoals },
    };
  });

  // Un pick encore en attente → on ne conclut pas le ticket aujourd'hui.
  if (anyPending) {
    return { status: 'pending', enrichedMatches, reason: `score(s) manquant(s), ticket âgé de ${ticketAgeDays}j < ${VOID_AFTER_DAYS}j — on attend` };
  }
  if (anyLost) {
    return { status: 'lost', enrichedMatches, reason: 'au moins un pick perdant' };
  }
  if (anyVoid) {
    return { status: 'void', enrichedMatches, reason: `score(s) introuvable(s) après ${VOID_AFTER_DAYS}j — annulation SANS notification` };
  }
  return { status: 'won', enrichedMatches, reason: 'tous les picks gagnants' };
}

// ─── Politique de notification ────────────────────────────────────────────────

/**
 * Un email/push de masse n'est envoyé QUE pour un résultat réel (gagné/perdu).
 * Un ticket "void" (annulé faute de scores) ne notifie personne : c'est un
 * problème de données interne, pas une information utilisateur.
 */
export function shouldNotifyUsers(status: TicketStatus): boolean {
  return status === 'won' || status === 'lost';
}

/**
 * Garde-fou anti-email de masse : seuil (en % des profils) au-delà duquel
 * un warning est loggé avant l'envoi. Configurable via MASS_EMAIL_WARN_PCT.
 */
export function massEmailWarnPct(): number {
  const raw = Number(process.env.MASS_EMAIL_WARN_PCT);
  return Number.isFinite(raw) && raw > 0 ? raw : 50;
}

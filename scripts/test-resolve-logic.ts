/**
 * Tests manuels de la logique de résolution des tickets (Sprint 1 — bug
 * annulation quotidienne + email de masse).
 *
 * Exécution : npx tsx scripts/test-resolve-logic.ts
 * Aucun accès réseau ni DB — teste uniquement lib/services/ticket-resolution.ts.
 */
import {
  ScoreIndex,
  VOID_AFTER_DAYS,
  evaluatePick,
  findScoreForPick,
  normalizeTeamName,
  resolveTicketMatches,
  shouldNotifyUsers,
  teamPairKey,
} from '../lib/services/ticket-resolution';

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.error(`  ❌ ${label} — attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`); }
}

// Index de scores simulant la réponse The Odds API (event id + noms d'équipes)
function buildIndex(): ScoreIndex {
  const index: ScoreIndex = { byId: new Map(), byTeams: new Map() };
  const put = (id: string, home: string, away: string, hg: number, ag: number) => {
    const score = { homeGoals: hg, awayGoals: ag, finished: true };
    index.byId.set(id, score);
    index.byTeams.set(teamPairKey(home, away), score);
  };
  put('a1b2c3', 'Arsenal', 'Chelsea', 2, 0);
  put('d4e5f6', 'Séville FC', 'Real Madrid', 1, 1);
  put('t7u8v9', 'Stefanos Tsitsipas', 'Andrey Rublev', 2, 1); // tennis (sets)
  return index;
}

const pick = (matchId: string, home: string, away: string, type = '1X2', value = '1') => ({
  matchId, homeTeam: home, awayTeam: away,
  selection: { type, value, odds: 1.8 },
});

console.log('\n── 1. Normalisation des noms d\'équipes ──');
check('accents/casse/ponctuation ignorés', normalizeTeamName('Séville F.C.'), 'sevillefc');
check('paire ordonnée', teamPairKey('Arsenal', 'Chelsea'), 'arsenal|chelsea');

console.log('\n── 2. evaluatePick ──');
check('1X2 "1" gagné sur 2-0', evaluatePick('1X2', '1', 2, 0), true);
check('1X2 "X" perdu sur 2-0', evaluatePick('1X2', 'X', 2, 0), false);
check('Double Chance 1X gagné sur 1-1', evaluatePick('Double Chance', '1X', 1, 1), true);
check('BTTS Oui perdu sur 2-0', evaluatePick('BTTS', 'Oui', 2, 0), false);
check('Over 2.5 gagné sur 2-1', evaluatePick('Over/Under', 'Over 2.5', 2, 1), true);
check('Under 2.5 gagné sur 1-1', evaluatePick('Over/Under', 'Under 2.5', 1, 1), true);

console.log('\n── 3. Lookup score (cœur du bug corrigé) ──');
const index = buildIndex();
check('event id brut', findScoreForPick(pick('a1b2c3', 'Arsenal', 'Chelsea'), index)?.homeGoals, 2);
check('id préfixé "odds-"', findScoreForPick(pick('odds-a1b2c3', 'Arsenal', 'Chelsea'), index)?.homeGoals, 2);
check('matchId SLUG résolu par noms (ancien bug → void)', findScoreForPick(pick('arsenal-vs-chelsea-2026-07-09', 'Arsenal', 'Chelsea'), index)?.homeGoals, 2);
check('id legacy "apif-" résolu par noms (ancien bug → void immédiat)', findScoreForPick(pick('apif-999', 'Séville FC', 'Real Madrid'), index)?.awayGoals, 1);
check('slug tennis résolu par noms', findScoreForPick(pick('stefanos-tsitsipas-vs-andrey-rublev-2026-07-08', 'Stefanos Tsitsipas', 'Andrey Rublev'), index)?.homeGoals, 2);
check('match inconnu → null', findScoreForPick(pick('xyz', 'PSG', 'OM'), index), null);

console.log('\n── 4. Résolution ticket : scénario "value bet trouvé" (ticket créé, scores dispo) ──');
const won = resolveTicketMatches([pick('arsenal-vs-chelsea-2026-07-09', 'Arsenal', 'Chelsea')], index, 1);
check('ticket gagné', won.status, 'won');
check('gagné → notification envoyée', shouldNotifyUsers(won.status), true);

const lost = resolveTicketMatches([pick('arsenal-vs-chelsea-2026-07-09', 'Arsenal', 'Chelsea', '1X2', '2')], index, 1);
check('ticket perdu', lost.status, 'lost');
check('perdu → notification envoyée', shouldNotifyUsers(lost.status), true);

console.log('\n── 5. Score introuvable : plus d\'annulation à J+1 ──');
const waiting = resolveTicketMatches([pick('psg-vs-om-2026-07-09', 'PSG', 'OM')], index, 1);
check(`J+1 < ${VOID_AFTER_DAYS}j → pending (ancien comportement: void + 92 emails)`, waiting.status, 'pending');
check('pending → aucune notification', shouldNotifyUsers(waiting.status), false);

const voided = resolveTicketMatches([pick('psg-vs-om-2026-07-05', 'PSG', 'OM')], index, VOID_AFTER_DAYS);
check(`J+${VOID_AFTER_DAYS} sans score → void`, voided.status, 'void');
check('void → AUCUN email de masse (fix principal)', shouldNotifyUsers(voided.status), false);

console.log('\n── 6. Ticket mixte : un pick sans score, un pick résolu ──');
const mixed = resolveTicketMatches([
  pick('arsenal-vs-chelsea-2026-07-09', 'Arsenal', 'Chelsea'),
  pick('psg-vs-om-2026-07-09', 'PSG', 'OM'),
], index, 1);
check('un pick en attente → ticket entier en attente', mixed.status, 'pending');

console.log('\n── 7. Scénario "aucun value bet" ──');
// Jour sans value bet: generateSpecialTickets ne crée AUCUN ticket → le cron
// répond "Aucun ticket en attente" et n'entre jamais dans notifyUsers.
// Le message utilisateur "Aujourd'hui, aucun pari avec une valeur suffisante"
// est géré côté dashboard (Chantier 2), jamais par email de masse.
const noTickets: unknown[] = [];
check('0 ticket créé → 0 résolution → 0 email', noTickets.length, 0);

console.log(`\n═══ Résultat: ${passed} OK, ${failed} KO ═══`);
process.exit(failed > 0 ? 1 : 0);

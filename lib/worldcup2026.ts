/**
 * Coupe du Monde 2026 — Phase de groupes
 * 16 groupes × 3 équipes × 3 matchs = 48 matchs
 * Hôtes : États-Unis, Canada, Mexique
 * Dates : 11 juin – 1er juillet 2026
 */

export interface WorldCupMatch {
  slug: string;
  homeTeam: string;
  awayTeam: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  group: string;      // 'A' … 'P'
  venue: string;
  city: string;
  country: 'USA' | 'Canada' | 'Mexique';
  competition: string;
  matchday: 1 | 2 | 3;
}

export const worldCupMatches: WorldCupMatch[] = [
  // ── Groupe A ──────────────────────────────────────────────────────────────
  {
    slug: 'etats-unis-vs-panama-11-juin-2026',
    homeTeam: 'États-Unis', awayTeam: 'Panama',
    date: '2026-06-11', time: '21:00',
    group: 'A', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'uruguay-vs-coree-du-sud-12-juin-2026',
    homeTeam: 'Uruguay', awayTeam: 'Corée du Sud',
    date: '2026-06-12', time: '18:00',
    group: 'A', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'etats-unis-vs-uruguay-20-juin-2026',
    homeTeam: 'États-Unis', awayTeam: 'Uruguay',
    date: '2026-06-20', time: '21:00',
    group: 'A', venue: 'MetLife Stadium', city: 'New York', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'panama-vs-coree-du-sud-20-juin-2026',
    homeTeam: 'Panama', awayTeam: 'Corée du Sud',
    date: '2026-06-20', time: '18:00',
    group: 'A', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'etats-unis-vs-coree-du-sud-27-juin-2026',
    homeTeam: 'États-Unis', awayTeam: 'Corée du Sud',
    date: '2026-06-27', time: '21:00',
    group: 'A', venue: 'Levi\'s Stadium', city: 'San Francisco', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
  {
    slug: 'panama-vs-uruguay-27-juin-2026',
    homeTeam: 'Panama', awayTeam: 'Uruguay',
    date: '2026-06-27', time: '21:00',
    group: 'A', venue: 'Rose Bowl', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },

  // ── Groupe B ──────────────────────────────────────────────────────────────
  {
    slug: 'mexique-vs-jamaique-12-juin-2026',
    homeTeam: 'Mexique', awayTeam: 'Jamaïque',
    date: '2026-06-12', time: '21:00',
    group: 'B', venue: 'Estadio Azteca', city: 'Mexico', country: 'Mexique',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'angleterre-vs-tunisie-12-juin-2026',
    homeTeam: 'Angleterre', awayTeam: 'Tunisie',
    date: '2026-06-12', time: '21:00',
    group: 'B', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'mexique-vs-angleterre-21-juin-2026',
    homeTeam: 'Mexique', awayTeam: 'Angleterre',
    date: '2026-06-21', time: '21:00',
    group: 'B', venue: 'Estadio Azteca', city: 'Mexico', country: 'Mexique',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'jamaique-vs-tunisie-21-juin-2026',
    homeTeam: 'Jamaïque', awayTeam: 'Tunisie',
    date: '2026-06-21', time: '18:00',
    group: 'B', venue: 'Hard Rock Stadium', city: 'Miami', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'mexique-vs-tunisie-28-juin-2026',
    homeTeam: 'Mexique', awayTeam: 'Tunisie',
    date: '2026-06-28', time: '21:00',
    group: 'B', venue: 'Estadio Azteca', city: 'Mexico', country: 'Mexique',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
  {
    slug: 'jamaique-vs-angleterre-28-juin-2026',
    homeTeam: 'Jamaïque', awayTeam: 'Angleterre',
    date: '2026-06-28', time: '21:00',
    group: 'B', venue: 'Gillette Stadium', city: 'Boston', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },

  // ── Groupe C ──────────────────────────────────────────────────────────────
  {
    slug: 'canada-vs-arabie-saoudite-13-juin-2026',
    homeTeam: 'Canada', awayTeam: 'Arabie Saoudite',
    date: '2026-06-13', time: '18:00',
    group: 'C', venue: 'BC Place', city: 'Vancouver', country: 'Canada',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'croatie-vs-maroc-13-juin-2026',
    homeTeam: 'Croatie', awayTeam: 'Maroc',
    date: '2026-06-13', time: '21:00',
    group: 'C', venue: 'Empower Field', city: 'Denver', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'canada-vs-croatie-22-juin-2026',
    homeTeam: 'Canada', awayTeam: 'Croatie',
    date: '2026-06-22', time: '18:00',
    group: 'C', venue: 'BMO Field', city: 'Toronto', country: 'Canada',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'arabie-saoudite-vs-maroc-22-juin-2026',
    homeTeam: 'Arabie Saoudite', awayTeam: 'Maroc',
    date: '2026-06-22', time: '21:00',
    group: 'C', venue: 'Allegiant Stadium', city: 'Las Vegas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'canada-vs-maroc-29-juin-2026',
    homeTeam: 'Canada', awayTeam: 'Maroc',
    date: '2026-06-29', time: '18:00',
    group: 'C', venue: 'BC Place', city: 'Vancouver', country: 'Canada',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
  {
    slug: 'arabie-saoudite-vs-croatie-29-juin-2026',
    homeTeam: 'Arabie Saoudite', awayTeam: 'Croatie',
    date: '2026-06-29', time: '18:00',
    group: 'C', venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },

  // ── Groupe D ──────────────────────────────────────────────────────────────
  {
    slug: 'bresil-vs-nigeria-13-juin-2026',
    homeTeam: 'Brésil', awayTeam: 'Nigéria',
    date: '2026-06-13', time: '21:00',
    group: 'D', venue: 'MetLife Stadium', city: 'New York', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'suisse-vs-serbie-14-juin-2026',
    homeTeam: 'Suisse', awayTeam: 'Serbie',
    date: '2026-06-14', time: '18:00',
    group: 'D', venue: 'Lumen Field', city: 'Seattle', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'bresil-vs-suisse-22-juin-2026',
    homeTeam: 'Brésil', awayTeam: 'Suisse',
    date: '2026-06-22', time: '21:00',
    group: 'D', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'nigeria-vs-serbie-22-juin-2026',
    homeTeam: 'Nigéria', awayTeam: 'Serbie',
    date: '2026-06-22', time: '18:00',
    group: 'D', venue: 'NRG Stadium', city: 'Houston', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'bresil-vs-serbie-29-juin-2026',
    homeTeam: 'Brésil', awayTeam: 'Serbie',
    date: '2026-06-29', time: '21:00',
    group: 'D', venue: 'MetLife Stadium', city: 'New York', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
  {
    slug: 'nigeria-vs-suisse-29-juin-2026',
    homeTeam: 'Nigéria', awayTeam: 'Suisse',
    date: '2026-06-29', time: '21:00',
    group: 'D', venue: 'Camping World Stadium', city: 'Orlando', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },

  // ── Groupe E ──────────────────────────────────────────────────────────────
  {
    slug: 'argentine-vs-perou-14-juin-2026',
    homeTeam: 'Argentine', awayTeam: 'Pérou',
    date: '2026-06-14', time: '21:00',
    group: 'E', venue: 'Hard Rock Stadium', city: 'Miami', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'france-vs-suede-14-juin-2026',
    homeTeam: 'France', awayTeam: 'Suède',
    date: '2026-06-14', time: '21:00',
    group: 'E', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'argentine-vs-france-23-juin-2026',
    homeTeam: 'Argentine', awayTeam: 'France',
    date: '2026-06-23', time: '21:00',
    group: 'E', venue: 'MetLife Stadium', city: 'New York', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'perou-vs-suede-23-juin-2026',
    homeTeam: 'Pérou', awayTeam: 'Suède',
    date: '2026-06-23', time: '18:00',
    group: 'E', venue: 'Rose Bowl', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'argentine-vs-suede-30-juin-2026',
    homeTeam: 'Argentine', awayTeam: 'Suède',
    date: '2026-06-30', time: '21:00',
    group: 'E', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
  {
    slug: 'perou-vs-france-30-juin-2026',
    homeTeam: 'Pérou', awayTeam: 'France',
    date: '2026-06-30', time: '21:00',
    group: 'E', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },

  // ── Groupe F ──────────────────────────────────────────────────────────────
  {
    slug: 'espagne-vs-bolivie-15-juin-2026',
    homeTeam: 'Espagne', awayTeam: 'Bolivie',
    date: '2026-06-15', time: '18:00',
    group: 'F', venue: 'Levi\'s Stadium', city: 'San Francisco', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'allemagne-vs-egypte-15-juin-2026',
    homeTeam: 'Allemagne', awayTeam: 'Égypte',
    date: '2026-06-15', time: '21:00',
    group: 'F', venue: 'Lincoln Financial Field', city: 'Philadelphie', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'espagne-vs-allemagne-23-juin-2026',
    homeTeam: 'Espagne', awayTeam: 'Allemagne',
    date: '2026-06-23', time: '21:00',
    group: 'F', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'bolivie-vs-egypte-23-juin-2026',
    homeTeam: 'Bolivie', awayTeam: 'Égypte',
    date: '2026-06-23', time: '18:00',
    group: 'F', venue: 'Estadio BBVA', city: 'Monterrey', country: 'Mexique',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'espagne-vs-egypte-30-juin-2026',
    homeTeam: 'Espagne', awayTeam: 'Égypte',
    date: '2026-06-30', time: '21:00',
    group: 'F', venue: 'Empower Field', city: 'Denver', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
  {
    slug: 'bolivie-vs-allemagne-30-juin-2026',
    homeTeam: 'Bolivie', awayTeam: 'Allemagne',
    date: '2026-06-30', time: '21:00',
    group: 'F', venue: 'Allegiant Stadium', city: 'Las Vegas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },

  // ── Groupe G ──────────────────────────────────────────────────────────────
  {
    slug: 'portugal-vs-ghana-15-juin-2026',
    homeTeam: 'Portugal', awayTeam: 'Ghana',
    date: '2026-06-15', time: '21:00',
    group: 'G', venue: 'Gillette Stadium', city: 'Boston', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'pays-bas-vs-chile-16-juin-2026',
    homeTeam: 'Pays-Bas', awayTeam: 'Chili',
    date: '2026-06-16', time: '18:00',
    group: 'G', venue: 'Lumen Field', city: 'Seattle', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'portugal-vs-pays-bas-24-juin-2026',
    homeTeam: 'Portugal', awayTeam: 'Pays-Bas',
    date: '2026-06-24', time: '21:00',
    group: 'G', venue: 'MetLife Stadium', city: 'New York', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'ghana-vs-chile-24-juin-2026',
    homeTeam: 'Ghana', awayTeam: 'Chili',
    date: '2026-06-24', time: '18:00',
    group: 'G', venue: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'portugal-vs-chile-01-juillet-2026',
    homeTeam: 'Portugal', awayTeam: 'Chili',
    date: '2026-07-01', time: '21:00',
    group: 'G', venue: 'Hard Rock Stadium', city: 'Miami', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
  {
    slug: 'ghana-vs-pays-bas-01-juillet-2026',
    homeTeam: 'Ghana', awayTeam: 'Pays-Bas',
    date: '2026-07-01', time: '21:00',
    group: 'G', venue: 'NRG Stadium', city: 'Houston', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },

  // ── Groupe H ──────────────────────────────────────────────────────────────
  {
    slug: 'belgique-vs-kenya-16-juin-2026',
    homeTeam: 'Belgique', awayTeam: 'Kenya',
    date: '2026-06-16', time: '21:00',
    group: 'H', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'italie-vs-venezuela-16-juin-2026',
    homeTeam: 'Italie', awayTeam: 'Venezuela',
    date: '2026-06-16', time: '21:00',
    group: 'H', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'belgique-vs-italie-24-juin-2026',
    homeTeam: 'Belgique', awayTeam: 'Italie',
    date: '2026-06-24', time: '21:00',
    group: 'H', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'kenya-vs-venezuela-24-juin-2026',
    homeTeam: 'Kenya', awayTeam: 'Venezuela',
    date: '2026-06-24', time: '18:00',
    group: 'H', venue: 'Camping World Stadium', city: 'Orlando', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'belgique-vs-venezuela-01-juillet-2026',
    homeTeam: 'Belgique', awayTeam: 'Venezuela',
    date: '2026-07-01', time: '21:00',
    group: 'H', venue: 'Gillette Stadium', city: 'Boston', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
  {
    slug: 'kenya-vs-italie-01-juillet-2026',
    homeTeam: 'Kenya', awayTeam: 'Italie',
    date: '2026-07-01', time: '21:00',
    group: 'H', venue: 'Lumen Field', city: 'Seattle', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 3,
  },
];

/** Groups metadata */
export const worldCupGroups: Record<string, { teams: string[]; description: string }> = {
  A: { teams: ['États-Unis', 'Panama', 'Uruguay', 'Corée du Sud'], description: 'Le groupe hôte avec les États-Unis, favoris à domicile.' },
  B: { teams: ['Mexique', 'Jamaïque', 'Angleterre', 'Tunisie'], description: 'Le Mexique, co-hôte, face à l\'Angleterre dans un choc XXL.' },
  C: { teams: ['Canada', 'Arabie Saoudite', 'Croatie', 'Maroc'], description: 'Le Canada, 3ème co-hôte, dans un groupe très ouvert.' },
  D: { teams: ['Brésil', 'Nigéria', 'Suisse', 'Serbie'], description: 'Le Brésil, grandissime favori, dans un groupe de fer africain.' },
  E: { teams: ['Argentine', 'Pérou', 'France', 'Suède'], description: 'Le choc ultime : Argentine vs France, remake de la finale 2022.' },
  F: { teams: ['Espagne', 'Bolivie', 'Allemagne', 'Égypte'], description: 'Espagne vs Allemagne, 2 titans européens dans le même groupe.' },
  G: { teams: ['Portugal', 'Ghana', 'Pays-Bas', 'Chili'], description: 'Portugal et Pays-Bas, deux favoris pour le titre dans le groupe G.' },
  H: { teams: ['Belgique', 'Kenya', 'Italie', 'Venezuela'], description: 'Belgique-Italie, un classique européen en phase de groupes.' },
};

/** Get all matches for a specific group */
export function getMatchesByGroup(group: string): WorldCupMatch[] {
  return worldCupMatches.filter((m) => m.group === group);
}

/** Get a match by slug */
export function getMatchBySlug(slug: string): WorldCupMatch | undefined {
  return worldCupMatches.find((m) => m.slug === slug);
}

/** Format date in French */
export function formatWorldCupDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

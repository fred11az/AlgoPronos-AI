/**
 * Coupe du Monde 2026 — Phase de groupes réelle
 * 12 groupes × 4 équipes
 * Hôtes : États-Unis, Canada, Mexique
 * Dates : 11 juin – 19 juillet 2026
 */

export interface WorldCupMatch {
  slug: string;
  homeTeam: string;
  awayTeam: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  group: string;      // 'A' … 'L'
  venue: string;
  city: string;
  country: 'USA' | 'Canada' | 'Mexique' | 'International';
  competition: string;
  matchday: 1 | 2 | 3;
}

export const worldCupMatches: WorldCupMatch[] = [
  // ── Groupe A ──────────────────────────────────────────────────────────────
  {
    slug: 'mexique-vs-afrique-du-sud-11-juin-2026',
    homeTeam: 'Mexique', awayTeam: 'Afrique du Sud',
    date: '2026-06-11', time: '21:00',
    group: 'A', venue: 'Estadio Azteca', city: 'Mexico', country: 'Mexique',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'coree-du-sud-vs-tchequie-12-juin-2026',
    homeTeam: 'Corée du Sud', awayTeam: 'Tchéquie',
    date: '2026-06-12', time: '18:00',
    group: 'A', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'mexique-vs-coree-du-sud-20-juin-2026',
    homeTeam: 'Mexique', awayTeam: 'Corée du Sud',
    date: '2026-06-20', time: '21:00',
    group: 'A', venue: 'MetLife Stadium', city: 'New York', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },
  {
    slug: 'afrique-du-sud-vs-tchequie-20-juin-2026',
    homeTeam: 'Afrique du Sud', awayTeam: 'Tchéquie',
    date: '2026-06-20', time: '18:00',
    group: 'A', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 2,
  },

  // ── Groupe B ──────────────────────────────────────────────────────────────
  {
    slug: 'canada-vs-bosnie-herzegovine-12-juin-2026',
    homeTeam: 'Canada', awayTeam: 'Bosnie-Herzégovine',
    date: '2026-06-12', time: '18:00',
    group: 'B', venue: 'BC Place', city: 'Vancouver', country: 'Canada',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'qatar-vs-suisse-13-juin-2026',
    homeTeam: 'Qatar', awayTeam: 'Suisse',
    date: '2026-06-13', time: '18:00',
    group: 'B', venue: 'Empower Field', city: 'Denver', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe C ──────────────────────────────────────────────────────────────
  {
    slug: 'bresil-vs-maroc-13-juin-2026',
    homeTeam: 'Brésil', awayTeam: 'Maroc',
    date: '2026-06-13', time: '21:00',
    group: 'C', venue: 'MetLife Stadium', city: 'New York', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'haiti-vs-ecosse-13-juin-2026',
    homeTeam: 'Haïti', awayTeam: 'Écosse',
    date: '2026-06-13', time: '18:00',
    group: 'C', venue: 'Lumen Field', city: 'Seattle', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe D ──────────────────────────────────────────────────────────────
  {
    slug: 'etats-unis-vs-paraguay-12-juin-2026',
    homeTeam: 'États-Unis', awayTeam: 'Paraguay',
    date: '2026-06-12', time: '21:00',
    group: 'D', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'australie-vs-turquie-13-juin-2026',
    homeTeam: 'Australie', awayTeam: 'Turquie',
    date: '2026-06-13', time: '18:00',
    group: 'D', venue: 'NRG Stadium', city: 'Houston', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe E ──────────────────────────────────────────────────────────────
  {
    slug: 'allemagne-vs-cote-divoire-14-juin-2026',
    homeTeam: 'Allemagne', awayTeam: 'Côte d\'Ivoire',
    date: '2026-06-14', time: '21:00',
    group: 'E', venue: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'curacao-vs-equateur-14-juin-2026',
    homeTeam: 'Curaçao', awayTeam: 'Équateur',
    date: '2026-06-14', time: '18:00',
    group: 'E', venue: 'Rose Bowl', city: 'Los Angeles', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe F ──────────────────────────────────────────────────────────────
  {
    slug: 'pays-bas-vs-suede-14-juin-2026',
    homeTeam: 'Pays-Bas', awayTeam: 'Suède',
    date: '2026-06-14', time: '21:00',
    group: 'F', venue: 'Levi\'s Stadium', city: 'San Francisco', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'japon-vs-tunisie-14-juin-2026',
    homeTeam: 'Japon', awayTeam: 'Tunisie',
    date: '2026-06-14', time: '18:00',
    group: 'F', venue: 'Lincoln Financial Field', city: 'Philadelphie', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe G ──────────────────────────────────────────────────────────────
  {
    slug: 'belgique-vs-egypte-15-juin-2026',
    homeTeam: 'Belgique', awayTeam: 'Égypte',
    date: '2026-06-15', time: '21:00',
    group: 'G', venue: 'Gillette Stadium', city: 'Boston', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'iran-vs-nouvelle-zelande-15-juin-2026',
    homeTeam: 'Iran', awayTeam: 'Nouvelle-Zélande',
    date: '2026-06-15', time: '18:00',
    group: 'G', venue: 'Lumen Field', city: 'Seattle', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe H ──────────────────────────────────────────────────────────────
  {
    slug: 'espagne-vs-uruguay-15-juin-2026',
    homeTeam: 'Espagne', awayTeam: 'Uruguay',
    date: '2026-06-15', time: '21:00',
    group: 'H', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'cap-vert-vs-sarabie-saoudite-15-juin-2026',
    homeTeam: 'Cap-Vert', awayTeam: 'Arabie Saoudite',
    date: '2026-06-15', time: '18:00',
    group: 'H', venue: 'Camping World Stadium', city: 'Orlando', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe I ──────────────────────────────────────────────────────────────
  {
    slug: 'france-vs-senegal-16-juin-2026',
    homeTeam: 'France', awayTeam: 'Sénégal',
    date: '2026-06-16', time: '21:00',
    group: 'I', venue: 'MetLife Stadium', city: 'New York', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'iraq-vs-norvege-16-juin-2026',
    homeTeam: 'Irak', awayTeam: 'Norvège',
    date: '2026-06-16', time: '18:00',
    group: 'I', venue: 'BMO Field', city: 'Toronto', country: 'Canada',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe J ──────────────────────────────────────────────────────────────
  {
    slug: 'argentine-vs-autriche-16-juin-2026',
    homeTeam: 'Argentine', awayTeam: 'Autriche',
    date: '2026-06-16', time: '21:00',
    group: 'J', venue: 'Hard Rock Stadium', city: 'Miami', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'algerie-vs-jordan-16-juin-2026',
    homeTeam: 'Algérie', awayTeam: 'Jordanie',
    date: '2026-06-16', time: '18:00',
    group: 'J', venue: 'Estadio BBVA', city: 'Monterrey', country: 'Mexique',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe K ──────────────────────────────────────────────────────────────
  {
    slug: 'portugal-vs-rd-congo-17-juin-2026',
    homeTeam: 'Portugal', awayTeam: 'RD Congo',
    date: '2026-06-17', time: '21:00',
    group: 'K', venue: 'Gillette Stadium', city: 'Boston', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'colombie-vs-ouzbekistan-17-juin-2026',
    homeTeam: 'Colombie', awayTeam: 'Ouzbékistan',
    date: '2026-06-17', time: '18:00',
    group: 'K', venue: 'Lumen Field', city: 'Seattle', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },

  // ── Groupe L ──────────────────────────────────────────────────────────────
  {
    slug: 'croatie-vs-angleterre-17-juin-2026',
    homeTeam: 'Croatie', awayTeam: 'Angleterre',
    date: '2026-06-17', time: '21:00',
    group: 'L', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  },
  {
    slug: 'ghana-vs-panama-17-juin-2026',
    homeTeam: 'Ghana', awayTeam: 'Panama',
    date: '2026-06-17', time: '18:00',
    group: 'L', venue: 'Camping World Stadium', city: 'Orlando', country: 'USA',
    competition: 'Coupe du Monde 2026', matchday: 1,
  }
];

export const worldCupGroups: Record<string, { teams: string[]; description: string }> = {
  A: { teams: ['Mexique', 'Afrique du Sud', 'Corée du Sud', 'Tchéquie'], description: 'Le Mexique co-hôte face à des adversaires coriaces.' },
  B: { teams: ['Canada', 'Bosnie-Herzégovine', 'Qatar', 'Suisse'], description: 'Le Canada co-hôte affronte la solide Nati suisse.' },
  C: { teams: ['Brésil', 'Maroc', 'Haïti', 'Écosse'], description: 'Le Brésil favori et le Maroc demi-finaliste 2022.' },
  D: { teams: ['États-Unis', 'Paraguay', 'Australie', 'Turquie'], description: 'Les USA co-hôtes défient le Paraguay et la Turquie.' },
  E: { teams: ['Allemagne', 'Côte d\'Ivoire', 'Curaçao', 'Équateur'], description: 'Choc des styles entre l\'Europe, l\'Afrique et l\'Amérique.' },
  F: { teams: ['Pays-Bas', 'Suède', 'Japon', 'Tunisie'], description: 'Groupe très homogène avec des techniciens japonais.' },
  G: { teams: ['Belgique', 'Égypte', 'Iran', 'Nouvelle-Zélande'], description: 'Les Diables Rouges face aux Pharaons d\'Égypte.' },
  H: { teams: ['Espagne', 'Uruguay', 'Cap-Vert', 'Arabie Saoudite'], description: 'Espagne et Uruguay favoris logiques de la poule H.' },
  I: { teams: ['France', 'Sénégal', 'Irak', 'Norvège'], description: 'La France de Mbappé retrouve le Sénégal pour un remake historique.' },
  J: { teams: ['Argentine', 'Autriche', 'Algérie', 'Jordanie'], description: 'L\'Argentine championne en titre face aux Fennecs d\'Algérie.' },
  K: { teams: ['Portugal', 'RD Congo', 'Colombie', 'Ouzbékistan'], description: 'La Colombie de retour face aux techniciens portugais.' },
  L: { teams: ['Angleterre', 'Croatie', 'Ghana', 'Panama'], description: 'Angleterre et Croatie se disputent la première place.' },
};

export function getMatchesByGroup(group: string): WorldCupMatch[] {
  return worldCupMatches.filter((m) => m.group === group);
}

export function getMatchBySlug(slug: string): WorldCupMatch | undefined {
  return worldCupMatches.find((m) => m.slug === slug);
}

export function formatWorldCupDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

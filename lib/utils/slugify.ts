/**
 * Converts a string to a URL-friendly slug.
 * Removes accents, special chars, replaces spaces with hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');
}

/** Generates the match slug: "arsenal-vs-chelsea-2026-03-14" */
export function createMatchSlug(homeTeam: string, awayTeam: string, date?: string): string {
  const base = `${slugify(homeTeam)}-vs-${slugify(awayTeam)}`;
  return date ? `${base}-${date}` : base;
}

/** Generates the league slug: "premier-league" */
export function createLeagueSlug(league: string): string {
  return slugify(league);
}

/** Generates the team slug: "real-madrid" */
export function createTeamSlug(team: string): string {
  return slugify(team);
}

/** Converts a slug back to a display name (best effort): "arsenal-vs-chelsea" → "Arsenal vs Chelsea" */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => (word === 'vs' ? 'vs' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

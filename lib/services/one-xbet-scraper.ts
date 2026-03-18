import fs from 'fs';
import { execSync } from 'child_process';

/**
 * 1xBet Scraper Service
 * Uses HTML scraping of league and match pages for high reliability.
 */
export interface ScrapedMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: number; // Unix timestamp
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

export class OneXBetScraper {
  private static readonly MIRROR = 'https://1xbet.bj';
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Discovers major football league URLs.
   */
  static async discoverLeagues(): Promise<string[]> {
    try {
      console.log(`[Scraper] Discovering leagues from ${this.MIRROR}/fr/line/football...`);
      const command = `curl.exe -s -L --ssl-no-revoke -H "User-Agent: ${this.USER_AGENT}" "${this.MIRROR}/fr/line/football"`;
      const output = execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      // Match league links: /fr/line/football/12345-league-name
      const urls = output.match(/\/fr\/line\/football\/[0-9]+-[a-z0-9-]+/g);
      if (!urls) return [];

      // Deduplicate and prefix with mirror
      const uniqueLeagues = Array.from(new Set(urls)).map(url => `${this.MIRROR}${url}`);
      console.log(`[Scraper] Found ${uniqueLeagues.length} leagues.`);
      return uniqueLeagues;
    } catch (e) {
      console.error('[Scraper] League discovery failed');
      return [];
    }
  }

  /**
   * Scrapes all matches from a league page.
   */
  static async scrapeLeagueMatches(leagueUrl: string): Promise<ScrapedMatch[]> {
    try {
      console.log(`[Scraper] Scraping league: ${leagueUrl}...`);
      const command = `curl.exe -s -L --ssl-no-revoke -H "User-Agent: ${this.USER_AGENT}" "${leagueUrl}"`;
      const output = execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      // Extract games array from HTML (JSON inside <script>)
      const gamesMatch = output.match(/\"games\":\s*(\[[\s\S]*?\])(?=,\s*\"[a-zA-Z]+\":|\}\s*<\/script>)/i);
      if (!gamesMatch) {
         console.warn(`[Scraper] No games array found in ${leagueUrl}`);
         return [];
      }

      const games = JSON.parse(gamesMatch[1]);
      if (!Array.isArray(games)) return [];

      const matches: ScrapedMatch[] = games.map((g: any) => {
        const odds: any = {};
        if (g.E && Array.isArray(g.E)) {
          const home = g.E.find((e: any) => e.T === 1);
          const draw = g.E.find((e: any) => e.T === 2);
          const away = g.E.find((e: any) => e.T === 3);
          
          if (home) odds.home = home.C;
          if (draw) odds.draw = draw.C;
          if (away) odds.away = away.C;
        }

        return {
          id: g.I,
          homeTeam: g.O1,
          awayTeam: g.O2,
          league: g.LE,
          date: g.S,
          odds: Object.keys(odds).length === 3 ? odds : undefined
        };
      });

      console.log(`[Scraper] Extracted ${matches.length} matches from ${leagueUrl}`);
      return matches;
    } catch (e) {
      console.error(`[Scraper] Failed to scrape league ${leagueUrl}`);
      return [];
    }
  }

  /**
   * Performs a full sync of football matches.
   */
  static async syncAllFootball(leagueLimit: number = 20): Promise<ScrapedMatch[]> {
    const leagues = await this.discoverLeagues();
    const targetLeagues = leagues.slice(0, leagueLimit);
    
    let allMatches: ScrapedMatch[] = [];
    for (const leagueUrl of targetLeagues) {
      const leagueMatches = await this.scrapeLeagueMatches(leagueUrl);
      allMatches = [...allMatches, ...leagueMatches];
    }

    console.log(`[Scraper] allMatches length before dedupe: ${allMatches.length}`);
    if (allMatches.length > 0) {
      console.log(`[Scraper] Sample ID: ${allMatches[0].id}`);
    }

    // Deduplicate matches by ID
    const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());
    console.log(`[Scraper] Total unique matches found: ${uniqueMatches.length}`);
    return uniqueMatches;
  }
}

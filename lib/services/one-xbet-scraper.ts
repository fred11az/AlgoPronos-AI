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
   * Performs a full sync of football matches using Firecrawl if available, otherwise falls back to curl.
   */
  static async syncAllFootball(leagueLimit: number = 20): Promise<ScrapedMatch[]> {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (apiKey) {
      console.log('[1xBet Scraper] Firecrawl API key found. Using Firecrawl...');
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${this.MIRROR}/fr/line/football`,
            formats: ['json'],
            waitFor: 5000,
            jsonOptions: {
              schema: {
                type: 'object',
                properties: {
                  matches: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', description: 'Internal match ID if visible, otherwise any unique identifier number' },
                        homeTeam: { type: 'string' },
                        awayTeam: { type: 'string' },
                        league: { type: 'string' },
                        time: { type: 'string', description: 'Time of the match (e.g. 18:00 or ISO/readable date)' },
                        odds: {
                          type: 'object',
                          properties: {
                            home: { type: 'number' },
                            draw: { type: 'number' },
                            away: { type: 'number' }
                          },
                          required: ['home', 'draw', 'away']
                        }
                      },
                      required: ['homeTeam', 'awayTeam', 'league', 'odds']
                    }
                  }
                },
                required: ['matches']
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const extractedMatches = result?.data?.json?.matches;

        if (Array.isArray(extractedMatches) && extractedMatches.length > 0) {
          console.log(`[1xBet Scraper] Firecrawl extracted ${extractedMatches.length} matches.`);
          
          return extractedMatches.map((m: any, index: number): ScrapedMatch => {
            // Parse or fallback date to Unix timestamp (seconds)
            let dateVal = Math.floor(Date.now() / 1000);
            if (m.time) {
              try {
                // If it looks like HH:MM, append to today's date
                if (/^\d{2}:\d{2}$/.test(m.time)) {
                  const [h, min] = m.time.split(':').map(Number);
                  const d = new Date();
                  d.setHours(h, min, 0, 0);
                  dateVal = Math.floor(d.getTime() / 1000);
                } else {
                  const parsed = Date.parse(m.time);
                  if (!isNaN(parsed)) {
                    dateVal = Math.floor(parsed / 1000);
                  }
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }

            return {
              id: m.id || (1000000 + index + Math.floor(Math.random() * 900000)),
              homeTeam: m.homeTeam,
              awayTeam: m.awayTeam,
              league: m.league,
              date: dateVal,
              odds: m.odds
            };
          });
        } else {
          console.warn('[1xBet Scraper] Firecrawl returned empty match array. Falling back to curl...');
        }
      } catch (err: any) {
        console.error('[1xBet Scraper] Firecrawl extraction failed:', err.message);
        console.log('[1xBet Scraper] Falling back to curl scraper...');
      }
    } else {
      console.log('[1xBet Scraper] No FIRECRAWL_API_KEY found. Using curl fallback...');
    }

    // Fallback: Curl Scraper
    try {
      const leagues = await this.discoverLeagues();
      const targetLeagues = leagues.slice(0, leagueLimit);
      
      let allMatches: ScrapedMatch[] = [];
      for (const leagueUrl of targetLeagues) {
        const leagueMatches = await this.scrapeLeagueMatches(leagueUrl);
        allMatches = [...allMatches, ...leagueMatches];
      }

      const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());
      console.log(`[1xBet Scraper] Curl sync found ${uniqueMatches.length} unique matches.`);
      return uniqueMatches;
    } catch (e) {
      console.error('[1xBet Scraper] Fallback sync failed:', e);
      return [];
    }
  }

  /**
   * Discovers major football league URLs (legacy curl helper).
   */
  static async discoverLeagues(): Promise<string[]> {
    try {
      console.log(`[Scraper] Discovering leagues from ${this.MIRROR}/fr/line/football...`);
      const command = `curl.exe -s -L --ssl-no-revoke -H "User-Agent: ${this.USER_AGENT}" "${this.MIRROR}/fr/line/football"`;
      const output = execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      const urls = output.match(/\/fr\/line\/football\/[0-9]+-[a-z0-9-]+/g);
      if (!urls) return [];

      const uniqueLeagues = Array.from(new Set(urls)).map(url => `${this.MIRROR}${url}`);
      return uniqueLeagues;
    } catch (e) {
      return [];
    }
  }

  /**
   * Scrapes all matches from a league page (legacy curl helper).
   */
  static async scrapeLeagueMatches(leagueUrl: string): Promise<ScrapedMatch[]> {
    try {
      console.log(`[Scraper] Scraping league: ${leagueUrl}...`);
      const command = `curl.exe -s -L --ssl-no-revoke -H "User-Agent: ${this.USER_AGENT}" "${leagueUrl}"`;
      const output = execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      const gamesMatch = output.match(/\"games\":\s*(\[[\s\S]*?\])(?=,\s*\"[a-zA-Z]+\":|\}\s*<\/script>)/i);
      if (!gamesMatch) return [];

      const games = JSON.parse(gamesMatch[1]);
      if (!Array.isArray(games)) return [];

      return games.map((g: any) => {
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
    } catch (e) {
      return [];
    }
  }
}


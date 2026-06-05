import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { OneXBetScraper } from '../lib/services/one-xbet-scraper';

import { FlashscoreScraper } from '../lib/services/flashscore-scraper';

async function main() {
  console.log('=== TESTING FIRECRAWL SCRAPERS ===');
  console.log('Firecrawl Key:', process.env.FIRECRAWL_API_KEY ? 'Present' : 'Missing');

  // Test 1: 1xBet Scraper
  console.log('\n--- 1. Testing 1xBet Scraper (Discover & Extract) ---');
  try {
    const matches = await OneXBetScraper.syncAllFootball();
    console.log(`Successfully synced ${matches.length} matches from 1xBet.`);
    if (matches.length > 0) {
      console.log('Sample Match 1:', JSON.stringify(matches[0], null, 2));
      if (matches.length > 1) {
        console.log('Sample Match 2:', JSON.stringify(matches[1], null, 2));
      }
    }
  } catch (err: any) {
    console.error('1xBet sync failed:', err.message || err);
  }

  // Test 2: Flashscore Scraper
  console.log('\n--- 2. Testing Flashscore Scraper (Form, Standings, H2H) ---');
  // Let's use a well-known match, or teams that are likely playing or have played recently
  const home = 'Real Madrid';
  const away = 'Barcelona';
  console.log(`Scraping stats for: ${home} vs ${away}...`);
  try {
    const stats = await FlashscoreScraper.getMatchStats(home, away);
    if (stats) {
      console.log('Flashscore Scraped Stats:', JSON.stringify(stats, null, 2));
    } else {
      console.warn('No stats returned from Flashscore Scraper.');
    }
  } catch (err: any) {
    console.error('Flashscore stats scraping failed:', err.message || err);
  }
}

main().catch(console.error);

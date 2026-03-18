import { OneXBetScraper } from '../services/one-xbet-scraper';

async function testScraper() {
  console.log('Testing OneXBetScraper (Full Sync)...');
  try {
    const results = await OneXBetScraper.syncAllFootball(2); // Test with 2 leagues
    if (results && results.length > 0) {
      console.log('--- SCRAPE RESULTS ---');
      console.log(`Total Matches Found: ${results.length}`);
      
      // Show first 10 matches as sample
      results.slice(0, 10).forEach((match, i) => {
        console.log(`Match ${i+1}: [${match.league}] ${match.homeTeam} vs ${match.awayTeam} (ID: ${match.id})`);
        if (match.odds) {
           console.log('  Odds:', JSON.stringify(match.odds));
        }
      });
      console.log('--- END RESULTS ---');
    } else {
      console.error('No matches scraped.');
    }
  } catch (error) {
    console.error('Scraper test failed:', error);
  }
}

testScraper();

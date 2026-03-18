
import { oneXBetFeed } from '../services/one-xbet-feed';
import 'dotenv/config';

async function testFeed() {
  console.log('Testing 1xBet Feed...');
  const matches = await oneXBetFeed.getPrematchOdds();
  console.log(`Found ${matches.length} matches.`);
  if (matches.length > 0) {
    console.log('First match sample:', JSON.stringify(matches[0], null, 2));
    
    // Check for African leagues
    const africanMatches = matches.filter(m => 
      m.league.toLowerCase().includes('benin') || 
      m.league.toLowerCase().includes('ivoire') || 
      m.league.toLowerCase().includes('senegal')
    );
    console.log(`Found ${africanMatches.length} African matches.`);
    if (africanMatches.length > 0) {
      console.log('African match sample:', JSON.stringify(africanMatches[0], null, 2));
    }
  }
}

testFeed();

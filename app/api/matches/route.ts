import { NextRequest, NextResponse } from 'next/server';
import { footballDataService } from '@/lib/services/football-data';
import { claudeMatchService } from '@/lib/services/claude-match-service';

// Leagues supported by Football-Data.org free tier
const footballDataLeagues = ['PL', 'LA', 'SA', 'BL', 'FL', 'CL', 'EL', 'PT1', 'NL1', 'BR1'];

// Leagues that need Claude search (African, etc.)
const claudeLeagues = ['CAN', 'CAF_CL', 'CAF_CC', 'BJ1', 'CI1', 'SN1', 'CM1', 'NG1', 'GH1', 'EG1', 'MA1', 'TN1', 'DZ1'];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');
  const leagues = searchParams.get('leagues');

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  if (!leagues) {
    return NextResponse.json({ error: 'Leagues are required' }, { status: 400 });
  }

  const leagueCodes = leagues.split(',');

  try {
    let allMatches: any[] = [];

    // Separate leagues by source
    const fdLeagues = leagueCodes.filter(code => footballDataLeagues.includes(code));
    const clLeagues = leagueCodes.filter(code => claudeLeagues.includes(code));
    const otherLeagues = leagueCodes.filter(code =>
      !footballDataLeagues.includes(code) && !claudeLeagues.includes(code)
    );

    // Fetch from Football-Data.org for European leagues
    if (fdLeagues.length > 0) {
      console.log(`Fetching from Football-Data.org: ${fdLeagues.join(', ')}`);
      const fdMatches = await footballDataService.getMatchesByDate(date, fdLeagues);
      allMatches = [...allMatches, ...fdMatches];
    }

    // Fetch from Claude for African leagues and others not in Football-Data
    const claudeSearchLeagues = [...clLeagues, ...otherLeagues];
    if (claudeSearchLeagues.length > 0) {
      console.log(`Fetching from Claude: ${claudeSearchLeagues.join(', ')}`);
      const claudeMatches = await claudeMatchService.getMatchesForDate(date, claudeSearchLeagues);
      allMatches = [...allMatches, ...claudeMatches];
    }

    // Sort by time
    allMatches.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return NextResponse.json({
      matches: allMatches,
      count: allMatches.length,
      date,
      leagues: leagueCodes,
      sources: {
        footballData: fdLeagues,
        claude: claudeSearchLeagues,
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

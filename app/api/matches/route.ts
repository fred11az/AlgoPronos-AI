import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/services/match-service';

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
    // Get REAL matches from APIs (API-Football or TheSportsDB)
    const matches = await matchService.getMatchesForDate(date, 'football', leagueCodes);

    // Sort by time
    matches.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    // Determine source from match IDs
    const source = matches.length > 0
      ? matches[0].id.startsWith('apif-')
        ? 'api-football'
        : matches[0].id.startsWith('tsdb-')
          ? 'thesportsdb'
          : 'cache'
      : 'none';

    return NextResponse.json({
      matches,
      count: matches.length,
      date,
      leagues: leagueCodes,
      source,
      message: matches.length === 0
        ? 'No matches found for this date. APIs may be unavailable or no games scheduled.'
        : `Found ${matches.length} real matches from ${source}`,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches', details: 'Check API keys and network connectivity' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { claudeMatchService } from '@/lib/services/claude-match-service';

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
    // Get matches from Claude (with 24h cache)
    const matches = await claudeMatchService.getMatchesForDate(date, leagueCodes);

    // Sort by time
    matches.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return NextResponse.json({
      matches,
      count: matches.length,
      date,
      leagues: leagueCodes,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

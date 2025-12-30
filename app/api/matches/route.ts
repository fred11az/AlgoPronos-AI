import { NextRequest, NextResponse } from 'next/server';
import { footballApi } from '@/lib/services/football-api';

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
    const matches = await footballApi.getMatchesByDate(date, leagueCodes);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

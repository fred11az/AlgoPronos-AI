import { NextResponse } from 'next/server';

export async function GET() {
  const footballDataKey = process.env.FOOTBALL_DATA_API_KEY;
  const oldApiKey = process.env.FOOTBALL_API_KEY;

  const results: any = {
    footballDataOrg: {
      keyPresent: !!footballDataKey,
    },
    apiFootball: {
      keyPresent: !!oldApiKey,
    },
  };

  // Test Football-Data.org (the free one)
  if (footballDataKey) {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Try fetching a week of matches to see what's available
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await fetch(
        `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${nextWeek}`,
        {
          headers: {
            'X-Auth-Token': footballDataKey,
          },
        }
      );

      const data = await response.json();

      results.footballDataOrg = {
        keyPresent: true,
        status: response.status,
        dateRange: `${today} to ${nextWeek}`,
        matchesCount: data.matches?.length || 0,
        competitions: Array.from(new Set(data.matches?.map((m: any) => m.competition.name) || [])),
        sample: data.matches?.slice(0, 5).map((m: any) => ({
          home: m.homeTeam.name,
          away: m.awayTeam.name,
          competition: m.competition.name,
          date: m.utcDate?.split('T')[0],
          time: m.utcDate,
        })),
        error: data.error || data.message || null,
      };
    } catch (error) {
      results.footballDataOrg.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return NextResponse.json(results);
}

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
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Test with Premier League specifically
      const plResponse = await fetch(
        `https://api.football-data.org/v4/competitions/PL/matches?dateFrom=${today}&dateTo=${nextWeek}`,
        {
          headers: {
            'X-Auth-Token': footballDataKey,
          },
        }
      );

      const plData = await plResponse.json();

      results.footballDataOrg = {
        keyPresent: true,
        status: plResponse.status,
        dateRange: `${today} to ${nextWeek}`,
        competition: 'Premier League (PL)',
        matchesCount: plData.matches?.length || 0,
        sample: plData.matches?.slice(0, 5).map((m: any) => ({
          home: m.homeTeam.name,
          away: m.awayTeam.name,
          date: m.utcDate?.split('T')[0],
          time: m.utcDate?.split('T')[1]?.substring(0, 5),
          status: m.status,
        })),
        error: plData.error || plData.message || null,
      };
    } catch (error) {
      results.footballDataOrg.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return NextResponse.json(results);
}

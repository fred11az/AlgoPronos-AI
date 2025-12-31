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
      const response = await fetch(
        `https://api.football-data.org/v4/matches?date=${today}`,
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
        matchesCount: data.matches?.length || 0,
        competitions: [...new Set(data.matches?.map((m: any) => m.competition.name) || [])],
        sample: data.matches?.slice(0, 3).map((m: any) => ({
          home: m.homeTeam.name,
          away: m.awayTeam.name,
          competition: m.competition.name,
          time: m.utcDate,
        })),
        error: data.error || null,
      };
    } catch (error) {
      results.footballDataOrg.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  return NextResponse.json(results);
}

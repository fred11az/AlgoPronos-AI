import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.FOOTBALL_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'API key not configured',
      keyPresent: false
    });
  }

  // Test the API with a fixtures request for today
  try {
    const today = new Date().toISOString().split('T')[0];

    // Test with Premier League (id: 39) for today
    const fixturesUrl = `https://v3.football.api-sports.io/fixtures?date=${today}&league=39&season=2024`;

    console.log('Testing fixtures URL:', fixturesUrl);

    const response = await fetch(fixturesUrl, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    const data = await response.json();

    return NextResponse.json({
      keyPresent: true,
      testDate: today,
      testLeague: 'Premier League (39)',
      testSeason: 2024,
      apiStatus: response.status,
      resultsCount: data.results,
      errors: data.errors,
      fixtures: data.response?.slice(0, 5) || [], // First 5 fixtures
      message: data.results > 0 ? 'Fixtures found!' : 'No fixtures for this date'
    });
  } catch (error) {
    return NextResponse.json({
      keyPresent: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.FOOTBALL_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'API key not configured',
      keyPresent: false
    });
  }

  // Test the API with a simple request
  try {
    const response = await fetch('https://v3.football.api-sports.io/status', {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    const data = await response.json();

    return NextResponse.json({
      keyPresent: true,
      keyLength: apiKey.length,
      keyPreview: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
      apiStatus: response.status,
      apiResponse: data,
    });
  } catch (error) {
    return NextResponse.json({
      keyPresent: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

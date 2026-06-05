import { NextRequest, NextResponse } from 'next/server';
import { matchService } from '@/lib/services/match-service';
import { worldCupMatches } from '@/lib/worldcup2026';

function getPlaceholderOdds(homeTeam: string, awayTeam: string) {
  const strongTeams = ['France', 'Brésil', 'Argentine', 'Espagne', 'Angleterre', 'Portugal', 'Allemagne', 'Belgique', 'Pays-Bas', 'Italie', 'Uruguay'];
  const mediumTeams = ['Mexique', 'Maroc', 'Sénégal', 'États-Unis', 'Canada', 'Suisse', 'Croatie', 'Turquie', 'Autriche', 'Algérie', 'Colombie', 'Suède', 'Japon', 'Égypte', 'Iran', 'Norvège', 'Tchéquie', 'Australie', 'Paraguay', 'Équateur', 'Tunisie'];
  
  const home = homeTeam.trim();
  const away = awayTeam.trim();

  if (strongTeams.includes(home) && !strongTeams.includes(away)) {
    return { home: 1.45, draw: 4.20, away: 6.80 };
  }
  if (!strongTeams.includes(home) && strongTeams.includes(away)) {
    return { home: 6.80, draw: 4.20, away: 1.45 };
  }
  if (mediumTeams.includes(home) && !strongTeams.includes(away) && !mediumTeams.includes(away)) {
    return { home: 1.75, draw: 3.50, away: 4.50 };
  }
  if (!strongTeams.includes(home) && !mediumTeams.includes(home) && mediumTeams.includes(away)) {
    return { home: 4.50, draw: 3.50, away: 1.75 };
  }
  
  return { home: 2.15, draw: 3.25, away: 3.10 };
}

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

    // ── World Cup 2026: serve directly from static data ─────────────────────
    if (leagueCodes.includes('WC')) {
      let wcSelectedMatches = worldCupMatches.filter((m) => {
        return m.date === date;
      });

      // Fallback: If no matches on the exact date, get upcoming matches starting from target date
      if (wcSelectedMatches.length === 0) {
        const target = new Date(date);
        wcSelectedMatches = worldCupMatches.filter((m) => {
          const d = new Date(m.date);
          return d >= target;
        }).slice(0, 12);
      }

      // If still empty (e.g. target date is after the World Cup), show first 12 matches
      if (wcSelectedMatches.length === 0) {
        wcSelectedMatches = worldCupMatches.slice(0, 12);
      }

      const mappedWcMatches = wcSelectedMatches.map((m) => ({
        id: `wc-${m.slug}`,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        league: 'Coupe du Monde FIFA 2026',
        leagueCode: 'WC',
        country: 'International',
        date: m.date,
        time: m.time,
        status: 'scheduled' as const,
        sport: 'football' as const,
        group: m.group,
        venue: m.venue,
        city: m.city,
        odds: getPlaceholderOdds(m.homeTeam, m.awayTeam),
      }));

      allMatches = [...allMatches, ...mappedWcMatches];
    }

    // ── Other leagues: scraper + API-Football ────────────────────────────────
    const otherCodes = leagueCodes.filter((c) => c !== 'WC');
    if (otherCodes.length > 0) {
      let scraped = await matchService.getMatchesForDate(date, 'football', otherCodes);
      
      // If no matches found on this date, check next 7 days
      if (scraped.length === 0) {
        const currentDate = new Date(date);
        for (let i = 1; i <= 7; i++) {
          const nextDateObj = new Date(currentDate);
          nextDateObj.setDate(currentDate.getDate() + i);
          const nextDateStr = nextDateObj.toISOString().split('T')[0];
          
          const futureScraped = await matchService.getMatchesForDate(nextDateStr, 'football', otherCodes);
          if (futureScraped.length > 0) {
            scraped = futureScraped;
            break;
          }
        }
      }

      // Ensure all scraped matches have odds (apply fallback if missing)
      const mappedScraped = scraped.map((m) => {
        if (!m.odds) {
          return {
            ...m,
            odds: getPlaceholderOdds(m.homeTeam, m.awayTeam),
          };
        }
        return m;
      });

      allMatches = [...allMatches, ...mappedScraped];
    }

    // Sort by date then time
    allMatches.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    });

    // Determine source
    const source = allMatches.length > 0
      ? allMatches[0].id.startsWith('wc-')
        ? 'worldcup2026-static'
        : allMatches[0].id.startsWith('1xbet-')
          ? '1xbet-scraper'
          : allMatches[0].id.startsWith('apif-')
            ? 'api-football'
            : 'mixed'
      : 'none';

    return NextResponse.json({
      matches: allMatches,
      count: allMatches.length,
      date,
      leagues: leagueCodes,
      source,
      message: allMatches.length === 0
        ? 'No matches found for this date and selected leagues.'
        : `Found ${allMatches.length} matches from ${source}`,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches', details: 'Check API keys and network connectivity' },
      { status: 500 }
    );
  }
}


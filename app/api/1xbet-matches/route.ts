import { NextRequest, NextResponse } from 'next/server';
import { oneXBetFeed } from '@/lib/services/one-xbet-feed';

// Cache pour éviter d'appeler curl à chaque requête
let matchesCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport') || '';

  try {
    // Utiliser le cache si disponible et pas expiré
    const now = Date.now();
    if (!matchesCache || now - matchesCache.timestamp > CACHE_TTL) {
      console.log('[API 1xbet-matches] Refreshing cache...');
      const matches = await oneXBetFeed.getPrematchOdds(0); // tous les sports
      matchesCache = { data: matches, timestamp: now };
    }

    let results = matchesCache.data;

    // Filtrer par sport si demandé
    if (sport) {
      results = results.filter(m =>
        m.sport?.toLowerCase().includes(sport.toLowerCase())
      );
    }

    // Statistiques par sport
    const statsBySport: Record<string, { leagues: number; matches: number }> = {};
    for (const m of matchesCache.data) {
      const s = m.sport || 'Autre';
      if (!statsBySport[s]) statsBySport[s] = { leagues: 0, matches: 0 };
      statsBySport[s].leagues += 1;
      statsBySport[s].matches += m.matchCount || 0;
    }

    const totalMatches = matchesCache.data.reduce((acc, m) => acc + (m.matchCount || 0), 0);

    return NextResponse.json({
      success: true,
      totalLeagues: matchesCache.data.length,
      totalMatches,
      statsBySport,
      matches: results,
      cachedAt: new Date(matchesCache.timestamp).toISOString(),
    });
  } catch (error) {
    console.error('[API 1xbet-matches] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de récupérer les matchs 1xBet' },
      { status: 500 }
    );
  }
}

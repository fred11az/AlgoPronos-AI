'use client';

import { useState, useEffect } from 'react';

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  date: number;
  score?: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

interface ApiResponse {
  success: boolean;
  totalMatches: number;
  statsBySport: Record<string, { matches: number }>;
  matches: Match[];
  cachedAt: string;
}

const SPORT_ICONS: Record<string, string> = {
  'Football': '⚽',
  'Tennis': '🎾',
  'Basket-ball': '🏀',
  'Tennis de table': '🏓',
  'Hockey sur glace': '🏒',
  'Volleyball': '🏐',
  'Baseball': '⚾',
  'Cricket': '🏏',
};

const AFFILIATE_BASE = process.env.NEXT_PUBLIC_1XBET_AFFILIATE_URL || 'https://refpa14435.com/L';

export default function OnexBetMatchesWidget() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('Football');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/1xbet-matches')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de charger les matchs');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="onexbet-widget-loading">
        <div className="onexbet-spinner" />
        <p>Chargement des matchs 1xBet en direct...</p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="onexbet-widget-error">
        <p>⚠️ {error || 'Données temporairement indisponibles'}</p>
      </div>
    );
  }

  const sports = Object.keys(data.statsBySport).filter(s =>
    !['Loterie', 'TOTO', 'Polybet', 'Trot', 'Courses hippiques', 'Jeux Virtuels', 'Curling', 'Lacrosse', 'Catch'].includes(s)
  );

  const filteredMatches = data.matches.filter(m => m.sport === selectedSport);

  // Group by League
  const leagues: Record<string, Match[]> = {};
  filteredMatches.forEach(m => {
    if (!leagues[m.league]) leagues[m.league] = [];
    leagues[m.league].push(m);
  });

  return (
    <div className="onexbet-widget">
      {/* Header */}
      <div className="onexbet-widget-header">
        <div className="onexbet-widget-title">
          <span className="onexbet-live-badge">LIVE 1xBet</span>
          <span className="onexbet-count">{data.totalMatches} matchs</span>
        </div>
        <a
          href={AFFILIATE_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="onexbet-cta-btn"
        >
          Voir tout sur 1xBet →
        </a>
      </div>

      {/* Sport tabs */}
      <div className="onexbet-sport-tabs hide-scrollbar">
        {sports.map(sport => (
          <button
            key={sport}
            className={`onexbet-sport-tab ${selectedSport === sport ? 'active' : ''}`}
            onClick={() => setSelectedSport(sport)}
          >
            {SPORT_ICONS[sport] || '🎯'} {sport}
            <span className="onexbet-sport-count">
              {data.statsBySport[sport]?.matches || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Matches list grouped by league */}
      <div className="onexbet-matches-list thin-scrollbar">
        {Object.keys(leagues).length === 0 ? (
          <p className="onexbet-empty">Aucun match disponible pour ce sport</p>
        ) : (
          Object.entries(leagues).map(([leagueName, matches]) => (
            <div key={leagueName} className="onexbet-league-group">
              <div className="onexbet-league-header">
                <span className="onexbet-league-name">{leagueName}</span>
              </div>
              
              <div className="onexbet-league-games">
                {matches.map(match => (
                  <div key={match.id} className="onexbet-match-card">
                    <div className="onexbet-match-teams">
                      <div className="onexbet-team-row">
                        <span className="onexbet-team-name">{match.homeTeam}</span>
                        {match.score && <span className="onexbet-score-val">{match.score.split('-')[0]}</span>}
                      </div>
                      <div className="onexbet-team-row">
                        <span className="onexbet-team-name">{match.awayTeam}</span>
                        {match.score && <span className="onexbet-score-val">{match.score.split('-')[1]}</span>}
                      </div>
                    </div>

                    <div className="onexbet-match-odds">
                      {match.odds && match.odds.home > 0 && (
                        <div className="onexbet-odds-row">
                          <a href={`${AFFILIATE_BASE}&subid=${match.id}`} target="_blank" className="onexbet-odd-btn">
                            <span className="onexbet-odd-label">1</span>
                            <span className="onexbet-odd-val">{match.odds.home.toFixed(2)}</span>
                          </a>
                          {match.odds.draw > 0 && (
                            <a href={`${AFFILIATE_BASE}&subid=${match.id}`} target="_blank" className="onexbet-odd-btn">
                              <span className="onexbet-odd-label">N</span>
                              <span className="onexbet-odd-val">{match.odds.draw.toFixed(2)}</span>
                            </a>
                          )}
                          <a href={`${AFFILIATE_BASE}&subid=${match.id}`} target="_blank" className="onexbet-odd-btn">
                            <span className="onexbet-odd-label">2</span>
                            <span className="onexbet-odd-val">{match.odds.away.toFixed(2)}</span>
                          </a>
                        </div>
                      )}
                      <a
                        href={`${AFFILIATE_BASE}&subid=${match.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="onexbet-bet-btn"
                      >
                        Parier →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="onexbet-widget-footer">
        <span>Actualisé : {new Date(data.cachedAt).toLocaleTimeString('fr-FR')}</span>
        <span className="onexbet-disclaimer">18+ | Jouez de manière responsable</span>
      </div>

      <style>{`
        .onexbet-widget {
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
          border: 1px solid rgba(255, 165, 0, 0.3);
          border-radius: 16px;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          max-width: 100%;
        }
        .onexbet-widget-loading, .onexbet-widget-error {
          background: #0a0a1a;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          color: #888;
        }
        .onexbet-spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(255,165,0,0.3);
          border-top-color: #ffa500;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .onexbet-widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(255,165,0,0.08);
          border-bottom: 1px solid rgba(255,165,0,0.2);
          flex-wrap: wrap;
          gap: 8px;
        }
        .onexbet-widget-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .onexbet-live-badge {
          background: #e53e3e;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: 4px;
          letter-spacing: 1px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        .onexbet-count {
          background: rgba(255,165,0,0.15);
          color: #ffa500;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          border: 1px solid rgba(255,165,0,0.3);
        }
        .onexbet-cta-btn {
          background: linear-gradient(135deg, #ffa500, #ff6b00);
          color: #000;
          font-weight: 800;
          font-size: 0.8rem;
          padding: 8px 16px;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .onexbet-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255,165,0,0.4);
        }
        .onexbet-sport-tabs {
          display: flex;
          gap: 6px;
          padding: 12px 16px;
          overflow-x: auto;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .onexbet-sport-tab {
          background: rgba(255,255,255,0.05);
          color: #aaa;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.78rem;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .onexbet-sport-tab:hover {
          background: rgba(255,165,0,0.1);
          color: #ffa500;
        }
        .onexbet-sport-tab.active {
          background: rgba(255,165,0,0.15);
          color: #ffa500;
          border-color: rgba(255,165,0,0.4);
          font-weight: 700;
        }
        .onexbet-sport-count {
          background: rgba(255,165,0,0.2);
          border-radius: 10px;
          padding: 1px 6px;
          font-size: 0.7rem;
        }
        .onexbet-matches-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 10px;
        }
        .onexbet-league-group {
          margin-bottom: 16px;
        }
        .onexbet-league-header {
          padding: 6px 10px;
          background: rgba(255,255,255,0.03);
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .onexbet-league-name {
          color: #ffa500;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .onexbet-match-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.2s;
        }
        .onexbet-match-card:hover {
          background: rgba(255,255,255,0.04);
        }
        .onexbet-match-teams {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .onexbet-team-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-right: 20px;
        }
        .onexbet-team-name {
          color: #fff;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .onexbet-score-val {
          color: #ffa500;
          font-weight: 800;
          font-size: 0.9rem;
          font-variant-numeric: tabular-nums;
        }
        .onexbet-match-odds {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          min-width: 140px;
        }
        .onexbet-odds-row {
          display: flex;
          gap: 4px;
          width: 100%;
        }
        .onexbet-odd-btn {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          padding: 4px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          transition: all 0.2s;
        }
        .onexbet-odd-btn:hover {
          background: rgba(255,165,0,0.2);
          border-color: #ffa500;
        }
        .onexbet-odd-label {
          color: #666;
          font-size: 0.6rem;
          font-weight: 700;
        }
        .onexbet-odd-val {
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .onexbet-bet-btn {
          color: #ffa500;
          font-size: 0.75rem;
          font-weight: 700;
          text-decoration: none;
        }
        .onexbet-bet-btn:hover { text-decoration: underline; }
        .onexbet-empty {
          color: #666;
          text-align: center;
          padding: 24px;
          font-size: 0.85rem;
        }
        .onexbet-widget-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: rgba(0,0,0,0.2);
          font-size: 0.7rem;
          color: #555;
        }
        .onexbet-disclaimer {
          font-size: 0.65rem;
          opacity: 0.6;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,165,0,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

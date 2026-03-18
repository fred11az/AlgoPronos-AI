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

export default function LiveFluxMatchesWidget() {
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
        setError('Impossible de charger les matchs en direct');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flux-widget-loading">
        <div className="flux-spinner" />
        <p>Synchronisation avec le flux live...</p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flux-widget-error">
        <p>⚠️ {error || 'Flux temporairement indisponible'}</p>
      </div>
    );
  }

  const sports = Object.keys(data.statsBySport).filter(s =>
    !['Loterie', 'TOTO', 'Polybet', 'Trot', 'Courses hippiques', 'Jeux Virtuels', 'Curling', 'Lacrosse', 'Catch'].includes(s)
  );

  const filteredMatches = data.matches.filter(m => m.sport === selectedSport);

  const leagues: Record<string, Match[]> = {};
  filteredMatches.forEach(m => {
    if (!leagues[m.league]) leagues[m.league] = [];
    leagues[m.league].push(m);
  });

  return (
    <div className="flux-widget">
      {/* Header */}
      <div className="flux-widget-header">
        <div className="flux-widget-title">
          <span className="flux-live-badge">FLUX LIVE PRO</span>
          <span className="flux-count">{data.totalMatches} évènements</span>
        </div>
        <a
          href={AFFILIATE_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="flux-cta-btn"
        >
          Ouvrir le flux complet →
        </a>
      </div>

      {/* Sport tabs */}
      <div className="flux-sport-tabs hide-scrollbar">
        {sports.map(sport => (
          <button
            key={sport}
            className={`flux-sport-tab ${selectedSport === sport ? 'active' : ''}`}
            onClick={() => setSelectedSport(sport)}
          >
            {SPORT_ICONS[sport] || '🎯'} {sport}
            <span className="flux-sport-count">
              {data.statsBySport[sport]?.matches || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Matches list grouped by league */}
      <div className="flux-matches-list thin-scrollbar">
        {Object.keys(leagues).length === 0 ? (
          <p className="flux-empty">Aucun match disponible pour ce sport</p>
        ) : (
          Object.entries(leagues).map(([leagueName, matches]) => (
            <div key={leagueName} className="flux-league-group">
              <div className="flux-league-header">
                <span className="flux-league-name">{leagueName}</span>
              </div>
              
              <div className="flux-league-games">
                {matches.map(match => (
                  <div key={match.id} className="flux-match-card">
                    <div className="flux-match-teams">
                      <div className="flux-team-row">
                        <span className="flux-team-name">{match.homeTeam}</span>
                        {match.score && <span className="flux-score-val">{match.score.split('-')[0]}</span>}
                      </div>
                      <div className="flux-team-row">
                        <span className="flux-team-name">{match.awayTeam}</span>
                        {match.score && <span className="flux-score-val">{match.score.split('-')[1]}</span>}
                      </div>
                    </div>

                    <div className="flux-match-odds">
                      {match.odds && match.odds.home > 0 && (
                        <div className="flux-odds-row">
                          <a href={`${AFFILIATE_BASE}&subid=${match.id}`} target="_blank" className="flux-odd-btn">
                            <span className="flux-odd-label">1</span>
                            <span className="flux-odd-val">{match.odds.home.toFixed(2)}</span>
                          </a>
                          {match.odds.draw > 0 && (
                            <a href={`${AFFILIATE_BASE}&subid=${match.id}`} target="_blank" className="flux-odd-btn">
                              <span className="flux-odd-label">N</span>
                              <span className="flux-odd-val">{match.odds.draw.toFixed(2)}</span>
                            </a>
                          )}
                          <a href={`${AFFILIATE_BASE}&subid=${match.id}`} target="_blank" className="flux-odd-btn">
                            <span className="flux-odd-label">2</span>
                            <span className="flux-odd-val">{match.odds.away.toFixed(2)}</span>
                          </a>
                        </div>
                      )}
                      <a
                        href={`${AFFILIATE_BASE}&subid=${match.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flux-bet-btn"
                      >
                        Pari Pro →
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
      <div className="flux-widget-footer">
        <span>Actualisé : {new Date(data.cachedAt).toLocaleTimeString('fr-FR')}</span>
        <span className="flux-disclaimer">Données partenaires — Jouez responsable</span>
      </div>

      <style>{`
        .flux-widget {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 20px;
          overflow: hidden;
          font-family: inherit;
          max-width: 100%;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3);
        }
        .flux-widget-loading, .flux-widget-error {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          color: #94a3b8;
        }
        .flux-spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(16, 185, 129, 0.1);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .flux-widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: linear-gradient(to bottom, rgba(16, 185, 129, 0.05), transparent);
          border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          flex-wrap: wrap;
          gap: 12px;
        }
        .flux-widget-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .flux-live-badge {
          background: #ef4444;
          color: #fff;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 1.5px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        .flux-count {
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 3px 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .flux-cta-btn {
          background: #10b981;
          color: #064e3b;
          font-weight: 800;
          font-size: 0.8rem;
          padding: 10px 20px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .flux-cta-btn:hover {
          transform: translateY(-2px);
          background: #34d399;
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
        }
        .flux-sport-tabs {
          display: flex;
          gap: 8px;
          padding: 16px 20px;
          overflow-x: auto;
          background: rgba(0, 0, 0, 0.2);
        }
        .flux-sport-tab {
          background: rgba(255, 255, 255, 0.03);
          color: #64748b;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .flux-sport-tab:hover {
          background: rgba(16, 185, 129, 0.05);
          color: #10b981;
        }
        .flux-sport-tab.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
          font-weight: 700;
        }
        .flux-sport-count {
          opacity: 0.5;
          font-size: 0.7rem;
        }
        .flux-matches-list {
          max-height: 400px;
          overflow-y: auto;
          padding: 16px;
        }
        .flux-league-group {
          margin-bottom: 24px;
        }
        .flux-league-header {
          padding: 6px 0;
          margin-bottom: 12px;
        }
        .flux-league-name {
          color: #f8fafc;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          opacity: 0.4;
        }
        .flux-match-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          transition: all 0.2s;
        }
        @media (max-width: 640px) {
          .flux-match-card { flex-direction: column; align-items: stretch; gap: 16px; }
        }
        .flux-match-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .flux-match-teams {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .flux-team-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .flux-team-name {
          color: #f1f5f9;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .flux-score-val {
          color: #10b981;
          font-weight: 900;
          font-size: 1rem;
          font-variant-numeric: tabular-nums;
        }
        .flux-match-odds {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          min-width: 160px;
        }
        .flux-odds-row {
          display: flex;
          gap: 6px;
          width: 100%;
        }
        .flux-odd-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          transition: all 0.2s;
        }
        .flux-odd-btn:hover {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
        }
        .flux-odd-label {
          color: #64748b;
          font-size: 0.6rem;
          font-weight: 700;
        }
        .flux-odd-val {
          color: #f8fafc;
          font-size: 0.85rem;
          font-weight: 800;
        }
        .flux-bet-btn {
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .flux-bet-btn:hover { color: #34d399; }
        .flux-empty {
          color: #64748b;
          text-align: center;
          padding: 32px;
          font-size: 0.9rem;
        }
        .flux-widget-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: rgba(0, 0, 0, 0.3);
          font-size: 0.7rem;
          color: #475569;
        }
        .flux-disclaimer {
          font-size: 0.65rem;
          opacity: 0.6;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

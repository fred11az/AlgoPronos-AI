'use client';

import { useEffect, useState } from 'react';
import { StatsKPIs } from './StatsKPIs';
import { ROICurve } from './ROICurve';
import { PicksHistory } from './PicksHistory';
import { CalibrationChart } from './CalibrationChart';
import { Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function PerformanceClient() {
  const [stats, setStats] = useState(null);
  const [curve, setCurve] = useState([]);
  const [history, setHistory] = useState([]);
  const [calibration, setCalibration] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sRes, cRes, hRes, calRes] = await Promise.all([
          fetch('/api/performance/stats').then(r => r.json()),
          fetch('/api/performance/curve').then(r => r.json()),
          fetch('/api/performance/history').then(r => r.json()),
          fetch('/api/performance/calibration').then(r => r.json())
        ]);

        setStats(sRes);
        setCurve(cRes.curve || []);
        setHistory(hRes.picks || []);
        setCalibration(calRes.calibration || []);
      } catch (err) {
        console.error('Failed to fetch performance data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 4 KPIs */}
      <StatsKPIs stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main ROI Curve (2/3 width) */}
        <div className="lg:col-span-2">
          <ROICurve data={curve} />
        </div>
        
        {/* Calibration Chart (1/3 width) */}
        <div className="lg:col-span-1">
          <CalibrationChart data={calibration} />
        </div>
      </div>

      {/* Full Picks History */}
      <PicksHistory picks={history} />
      
      {/* Social Proof Footer */}
      <div className="bg-primary/5 border border-primary/20 p-8 rounded-2xl text-center">
        <h4 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Trophy className="text-primary" />
          Convaincu par la précision de l'algorithme ?
        </h4>
        <p className="text-text-muted mb-6 max-w-2xl mx-auto">
          Nos pronostics sont basés sur le modèle statistique Dixon-Coles, vérifié historiquement. 
          Rejoignez des milliers d'utilisateurs qui optimisent leurs gains avec l'IA.
        </p>
        <Link 
          href="/pronostics" 
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-surface font-bold px-8 py-4 rounded-xl transition-all hover:scale-105"
        >
          Voir les pronos du jour <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, Wifi } from 'lucide-react';

const LINES: Array<{ text: string; delay: number; type: 'cmd' | 'ok' | 'info' | 'warn' | 'data' }> = [
  { text: '> Initialisation moteur AlgoPronos v4.2...', delay: 0,    type: 'cmd'  },
  { text: '  Connexion flux 1xBet sécurisée... [OK]',  delay: 700,  type: 'ok'   },
  { text: '> Chargement historique Crash (10 000 tirages)...', delay: 1300, type: 'cmd' },
  { text: '  Distribution empirique calculée... [OK]', delay: 2100, type: 'ok'   },
  { text: '  RTP mesuré : 96.97%  |  House Edge : 3.03%', delay: 2700, type: 'data' },
  { text: '> Analyse Apple of Fortune (séries récentes)...', delay: 3400, type: 'cmd' },
  { text: '  Écart-type session : σ = 1.82  μ = 2.05x', delay: 4100, type: 'data' },
  { text: '  Secteur x2 : 44.8% observé vs 45.0% théo. [OK]', delay: 4700, type: 'ok' },
  { text: '> Modèle Poisson — events rares (x50+)...', delay: 5400, type: 'cmd'  },
  { text: '  λ = 0.048  |  P(x50+ sur 100 tirages) = 0.87%', delay: 6000, type: 'data' },
  { text: '  Conformité RNG certifiée... [OK]',         delay: 6600, type: 'ok'   },
  { text: '> Calcul House Edge effectif post-cashback...', delay: 7200, type: 'cmd' },
  { text: '  Cashback 10% → House Edge effectif : 2.73%', delay: 7900, type: 'data' },
  { text: '  [WARN] Variance élevée — appliquer stop-loss', delay: 8500, type: 'warn' },
  { text: '> Synchronisation Compte Optimisé IA... [OK]', delay: 9200, type: 'ok' },
  { text: '  Flux 1xBet actif ✓  |  Code : ALGOPRONOS ✓', delay: 9800, type: 'ok' },
];

// Restart cycle after last line + pause
const RESTART_DELAY = 14000;

export function TerminalIAWidget() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [showCursor, setShowCursor]     = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Blink cursor
  useEffect(() => {
    const id = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Line-by-line reveal with restart loop
  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];

    function start() {
      setVisibleLines(0);
      LINES.forEach((_, i) => {
        const t = setTimeout(() => setVisibleLines(i + 1), LINES[i].delay);
        timers.push(t);
      });
      const restart = setTimeout(() => {
        timers = [];
        start();
      }, RESTART_DELAY);
      timers.push(restart);
    }

    start();
    return () => timers.forEach(clearTimeout);
  }, []);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  function lineColor(type: (typeof LINES)[number]['type']) {
    switch (type) {
      case 'ok':   return 'text-green-400';
      case 'data': return 'text-cyan-400';
      case 'warn': return 'text-yellow-400';
      case 'cmd':  return 'text-green-300';
      case 'info': return 'text-gray-400';
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Window chrome */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-green-400" />
            <span className="text-gray-400 text-xs font-mono">
              algopronos-ai — analyse flux 1xBet — bash
            </span>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <Wifi className="h-3 w-3 text-green-400" />
            <span className="text-green-400 text-xs font-mono">LIVE</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
        </div>

        {/* Terminal body */}
        <div
          ref={containerRef}
          className="bg-black/95 px-4 py-4 h-44 overflow-y-auto font-mono text-xs leading-relaxed scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="text-gray-600 mb-2 select-none">
            AlgoPronos AI · Data Visualization Engine · {new Date().getFullYear()}
          </div>

          {LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className={`${lineColor(line.type)} whitespace-pre`}>
              {line.text}
            </div>
          ))}

          {/* Blinking cursor */}
          <span
            className={`inline-block w-2 h-3.5 bg-green-400 ml-0.5 align-middle transition-opacity duration-100 ${
              showCursor ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/60 border-t border-gray-700/50 text-gray-500 text-xs font-mono">
          <span>
            {visibleLines}/{LINES.length} lignes · Analyse en cours
          </span>
          <span className="text-green-500">
            ● Connecté au flux 1xBet
          </span>
        </div>
      </div>
    </div>
  );
}

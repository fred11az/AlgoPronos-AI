'use client';

const bookmakers = [
  { name: '1xBet',      abbr: '1X',  color: '#1E88E5', bg: '#1E88E515' },
  { name: 'Betway',     abbr: 'BW',  color: '#00A650', bg: '#00A65015' },
  { name: 'Melbet',     abbr: 'MB',  color: '#E53935', bg: '#E5393515' },
  { name: 'BetWinner',  abbr: 'BW+', color: '#FF6F00', bg: '#FF6F0015' },
  { name: 'Premier Bet',abbr: 'PB',  color: '#1A237E', bg: '#1A237E15' },
  { name: '22Bet',      abbr: '22',  color: '#F9A825', bg: '#F9A82515' },
  { name: 'SportyBet',  abbr: 'SB',  color: '#00897B', bg: '#00897B15' },
];

// Duplicate for seamless infinite loop
const items = [...bookmakers, ...bookmakers];

export function BookmakerMarquee() {
  return (
    <section className="py-12 bg-surface border-y border-surface-light overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
        <p className="text-sm font-medium text-text-muted uppercase tracking-widest">
          Partenaires Bookmakers
        </p>
      </div>

      {/* Track */}
      <div className="relative flex">
        <div className="flex gap-6 animate-marquee group-hover:pause whitespace-nowrap">
          {items.map((bm, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-6 py-3 rounded-xl border border-surface-light bg-background
                         grayscale hover:grayscale-0 transition-all duration-300 cursor-default shrink-0"
              style={{
                borderColor: `${bm.color}30`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = bm.bg;
                (e.currentTarget as HTMLDivElement).style.borderColor = `${bm.color}60`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '';
                (e.currentTarget as HTMLDivElement).style.borderColor = `${bm.color}30`;
              }}
            >
              {/* Logo placeholder — styled circle with initials */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: `${bm.color}20`, color: bm.color }}
              >
                {bm.abbr}
              </div>
              <span className="font-semibold text-text-secondary text-sm whitespace-nowrap">
                {bm.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

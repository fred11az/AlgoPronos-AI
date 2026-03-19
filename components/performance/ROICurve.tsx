'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';

interface CurvePoint {
  date: string;
  roi: number;
  pnl: number;
}

export function ROICurve({ data }: { data: CurvePoint[] }) {
  if (!data || data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-surface-light border border-white/5 p-6 rounded-2xl mb-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Évolution du ROI Cumulé</h3>
        <div className="text-xs text-text-muted uppercase tracking-wider">Histo. validé par RapidAPI</div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              dataKey="date" 
              hide={true} 
            />
            <YAxis 
              stroke="#ffffff40" 
              fontSize={12} 
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1d21', border: '1px solid #ffffff10', borderRadius: '12px' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [`${value}%`, 'ROI Cumulé']}
            />
            <Area
              type="monotone"
              dataKey="roi"
              stroke="var(--color-primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRoi)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

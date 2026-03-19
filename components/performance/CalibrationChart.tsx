'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

interface CalibrationPoint {
  prob: number;
  actual: number;
  count: number;
}

export function CalibrationChart({ data }: { data: CalibrationPoint[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-surface-light border border-white/5 p-6 rounded-2xl"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Calibration du Modèle</h3>
          <p className="text-xs text-text-muted mt-1">Comparaison Probabilité Modèle vs Taux Réel</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <ReferenceLine stroke="var(--color-primary)" />
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis 
              type="number" 
              dataKey="prob" 
              name="Probabilité Modèle" 
              unit="%" 
              stroke="#ffffff40" 
              fontSize={10}
              domain={[0, 100]}
            />
            <YAxis 
              type="number" 
              dataKey="actual" 
              name="Taux Réel" 
              unit="%" 
              stroke="#ffffff40" 
              fontSize={10}
              domain={[0, 100]}
            />
            <ZAxis type="number" dataKey="count" range={[40, 400]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              contentStyle={{ backgroundColor: '#1a1d21', border: '1px solid #ffffff10', borderRadius: '12px' }}
              itemStyle={{ color: 'var(--color-primary)' }}
            />
            <ReferenceLine x={0} y={0} stroke="#ffffff20" />
            <ReferenceLine 
              segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} 
              stroke="var(--color-secondary)" 
              strokeDasharray="5 5"
              label={{ position: 'top', value: 'Calibration Parfaite', fill: '#ffffff20', fontSize: 10 }}
            />
            <Scatter name="Points de Calibration" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="var(--color-primary)" />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-text-muted/60 text-center mt-4 italic">
        Si les points suivent la diagonale, le modèle est parfaitement calibré (honnête).
      </p>
    </motion.div>
  );
}

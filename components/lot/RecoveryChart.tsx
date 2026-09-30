'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Comparable } from '@/types';
import { pct } from '@/lib/format';

/** Recovery benchmark: comparable closed lots as a small range chart (PRD 8.4.7). Single series, no legend needed. */
export function RecoveryChart({ comparables, currentPct }: { comparables: Comparable[]; currentPct?: number }) {
  if (comparables.length === 0) {
    return <p className="text-sm text-ink-muted">No comparable closed lots yet for this category and grade.</p>;
  }
  const values = comparables.map((c) => c.recoveryPct * 100);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const data = comparables.map((c, i) => ({ x: c.recoveryPct * 100, y: 0, key: i }));
  const domainMax = Math.max(max, (currentPct ?? 0) * 100) + 5;

  return (
    <div>
      <p className="mb-1 text-sm text-ink">
        Comparable closed lots range from <span className="font-medium tabular-nums">{pct(min / 100, 0)}</span> to{' '}
        <span className="font-medium tabular-nums">{pct(max / 100, 0)}</span> of retail value.
      </p>
      <div className="h-20 w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 16, right: 16, bottom: 0, left: 16 }}>
            <CartesianGrid horizontal={false} stroke="var(--line)" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, domainMax]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
              axisLine={{ stroke: 'var(--line)' }}
              tickLine={false}
            />
            <YAxis type="number" dataKey="y" hide domain={[-1, 1]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'var(--line)' }}
              formatter={(value) => [`${Number(value).toFixed(0)}%`, 'Recovery']}
              contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: 'var(--line)' }}
            />
            {currentPct !== undefined && (
              <ReferenceLine x={currentPct * 100} stroke="var(--kraft)" strokeWidth={2} label={{ value: 'Your bid', position: 'top', fontSize: 11, fill: 'var(--kraft)' }} />
            )}
            <Scatter data={data} fill="var(--primary)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

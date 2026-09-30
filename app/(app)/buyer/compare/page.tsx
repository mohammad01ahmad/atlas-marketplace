'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { calcLandedCostPerUnit, calcRecoveryPct } from '@/lib/rules';
import { comparablesFor } from '@/data/comparables';
import { aed, pct, formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export default function ComparePage() {
  const compareIds = useAtlasStore((s) => s.compareIds);
  const removeFromCompare = useAtlasStore((s) => s.removeFromCompare);
  const allLots = useAtlasStore((s) => s.lots);
  const lots = allLots.filter((l) => compareIds.includes(l.id));
  const companies = useAtlasStore((s) => s.companies);
  const comparables = useAtlasStore((s) => s.comparables);
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  if (lots.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-ink">Compare lots</h1>
        <EmptyState text="Nothing to compare yet. Add up to 3 lots from Browse lots." actionLabel="Browse lots" actionHref="/buyer/lots" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-ink">Compare lots</h1>
      <div className="flex gap-4 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory] sm:grid sm:grid-cols-3">
        {lots.map((lot) => {
          const seller = companies.find((c) => c.id === lot.sellerId);
          const totalUnits = lot.manifest.reduce((s, m) => s + m.qty, 0);
          const totalRetailValue = lot.manifest.reduce((s, m) => s + m.qty * m.unitRetailValue, 0);
          const amount = amounts[lot.id] ?? Math.round(totalRetailValue * 0.2);
          const comps = comparablesFor(comparables, lot.category, lot.grade);
          const min = comps.length ? Math.min(...comps.map((c) => c.recoveryPct)) : 0;
          const max = comps.length ? Math.max(...comps.map((c) => c.recoveryPct)) : 0;

          return (
            <div key={lot.id} className="w-72 shrink-0 space-y-3 rounded-[10px] border border-line bg-surface p-4 [scroll-snap-align:start] sm:w-auto">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/lots/${lot.id}`} className="text-sm font-semibold text-ink hover:text-primary">
                  {lot.title}
                </Link>
                <button type="button" onClick={() => removeFromCompare(lot.id)} aria-label="Remove from compare" className="text-ink-muted hover:text-ink">
                  <X size={15} />
                </button>
              </div>

              <Badge tone="primary">{lot.grade}</Badge>

              <dl className="space-y-1.5 text-sm">
                <Row label="Units" value={totalUnits.toLocaleString()} />
                <Row label="Retail value" value={aed(totalRetailValue)} />
                <Row label="Recovery benchmark" value={comps.length ? `${pct(min, 0)} to ${pct(max, 0)}` : 'No comparables'} />
                <Row label="Seller manifest accuracy" value={`${Math.round((seller?.manifestAccuracy ?? 0) * 100)}%`} />
                <Row label="Closing time" value={formatDateTime(lot.closesAt)} />
                <Row label="Conditions" value={lot.conditions.length ? lot.conditions.join('; ') : 'None'} />
              </dl>

              <div className="border-t border-line pt-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted">Your bid (AED)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmounts((a) => ({ ...a, [lot.id]: Number(e.target.value) || 0 }))}
                  className="h-9 w-full rounded-md border border-line bg-paper px-2.5 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
                />
                <p className="mt-1.5 text-sm">
                  <span className="font-medium tabular-nums">{aed(calcLandedCostPerUnit(amount, 0, totalUnits || 1))}</span>
                  <span className="text-ink-muted"> landed / unit · {pct(calcRecoveryPct(amount, totalRetailValue || 1), 1)} recovery</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

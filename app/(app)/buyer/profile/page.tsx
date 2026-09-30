'use client';

import { ShieldCheck, Wallet } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { aed, formatDate } from '@/lib/format';

/** PRD 8.16 buyer profile. */
export default function BuyerProfilePage() {
  const activeBuyerId = useAtlasStore((s) => s.activeBuyerId);
  const buyer = useAtlasStore((s) => s.companies.find((c) => c.id === activeBuyerId));
  if (!buyer) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{buyer.name}</h1>
        <p className="text-sm text-ink-muted">
          {buyer.area}, {buyer.emirate} · Member since {formatDate(buyer.memberSince)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" data-tour="verification-badges">
        <Badge tone="primary" icon={ShieldCheck}>
          Licence verified
        </Badge>
        <Badge tone="info" icon={Wallet}>
          Deposit balance available: {aed(buyer.depositBalance ?? 0)}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-[10px] border border-line bg-surface p-4 sm:grid-cols-3">
        <Stat label="Markets served" value={buyer.marketsServed?.join(', ') ?? '—'} />
        <Stat label="Lots won" value={String(buyer.lotsWon ?? 0)} />
        <Stat label="Completion rate" value={`${Math.round((buyer.completionRate ?? 0) * 100)}%`} />
        <Stat label="Collection reliability" value={`${Math.round((buyer.collectionReliability ?? 0) * 100)}%`} />
        <Stat label="Categories" value={buyer.categories.join(', ')} />
      </dl>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Strikes</h2>
        {buyer.strikes.length === 0 ? (
          <p className="text-sm text-ink-muted">No strikes on record.</p>
        ) : (
          <ul className="space-y-2">
            {buyer.strikes.map((s, i) => (
              <li key={i} className="rounded-md border border-line bg-surface p-3 text-sm">
                <p className="text-ink">{s.reason}</p>
                <p className="text-xs text-ink-muted">{formatDate(s.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

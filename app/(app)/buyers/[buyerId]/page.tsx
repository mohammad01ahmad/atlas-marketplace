'use client';

import { use } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/format';

export default function PublicBuyerProfilePage({ params }: { params: Promise<{ buyerId: string }> }) {
  const { buyerId } = use(params);
  const buyer = useAtlasStore((s) => s.companies.find((c) => c.id === buyerId));
  if (!buyer) return <p className="text-sm text-ink-muted">Buyer not found.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{buyer.name}</h1>
        <p className="text-sm text-ink-muted">
          {buyer.area}, {buyer.emirate} · Member since {formatDate(buyer.memberSince)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="primary" icon={ShieldCheck}>
          Licence verified
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-[10px] border border-line bg-surface p-4 sm:grid-cols-3">
        <Stat label="Markets served" value={buyer.marketsServed?.join(', ') ?? '—'} />
        <Stat label="Lots won" value={String(buyer.lotsWon ?? 0)} />
        <Stat label="Completion rate" value={`${Math.round((buyer.completionRate ?? 0) * 100)}%`} />
        <Stat label="Collection reliability" value={`${Math.round((buyer.collectionReliability ?? 0) * 100)}%`} />
      </dl>
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

'use client';

import { ShieldCheck, FileCheck } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/format';

/** PRD 8.16 seller profile. */
export default function SellerProfilePage() {
  const activeSellerId = useAtlasStore((s) => s.activeSellerId);
  const seller = useAtlasStore((s) => s.companies.find((c) => c.id === activeSellerId));
  if (!seller) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{seller.name}</h1>
        <p className="text-sm text-ink-muted">
          {seller.area}, {seller.emirate} · Member since {formatDate(seller.memberSince)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="primary" icon={ShieldCheck}>
          Licence verified
        </Badge>
        <Badge tone="primary" icon={FileCheck}>
          Provenance history verified
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-[10px] border border-line bg-surface p-4 sm:grid-cols-3">
        <Stat label="Manifest accuracy" value={`${Math.round((seller.manifestAccuracy ?? 0) * 100)}%`} />
        <Stat label="Lots sold" value={String(seller.lotsSold ?? 0)} />
        <Stat label="Dispute rate" value={`${Math.round((seller.disputeRate ?? 0) * 100)}%`} />
        <Stat label="Average time to collection readiness" value={`${seller.avgReadyHours ?? 0}h`} />
        <Stat label="Categories" value={seller.categories.join(', ')} />
      </dl>

      {seller.manifestAccuracyHistory && seller.manifestAccuracyHistory.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Manifest accuracy history</h2>
          <ul className="flex flex-wrap gap-2 text-xs text-ink-muted">
            {seller.manifestAccuracyHistory.map((h) => (
              <li key={h.at} className="rounded-md border border-line bg-surface px-2.5 py-1.5">
                {formatDate(h.at)}: {Math.round(h.value * 100)}%
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Strikes</h2>
        {seller.strikes.length === 0 ? (
          <p className="text-sm text-ink-muted">No strikes on record.</p>
        ) : (
          <ul className="space-y-2">
            {seller.strikes.map((s, i) => (
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

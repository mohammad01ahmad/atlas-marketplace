'use client';

import { use } from 'react';
import { ShieldCheck, FileCheck } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/format';

export default function PublicSellerProfilePage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = use(params);
  const seller = useAtlasStore((s) => s.companies.find((c) => c.id === sellerId));
  if (!seller) return <p className="text-sm text-ink-muted">Seller not found.</p>;

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

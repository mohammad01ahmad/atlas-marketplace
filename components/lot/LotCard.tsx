'use client';

import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import type { Lot } from '@/types';
import { useAtlasStore, useNow } from '@/lib/store';
import { estimateLandedCostPerUnit } from '@/lib/rules';
import { aed, countdownText } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function LotCard({ lot }: { lot: Lot }) {
  const now = useNow();
  const companies = useAtlasStore((s) => s.companies);
  const bids = useAtlasStore((s) => s.bids);
  const comparables = useAtlasStore((s) => s.comparables);
  const compareIds = useAtlasStore((s) => s.compareIds);
  const addToCompare = useAtlasStore((s) => s.addToCompare);
  const removeFromCompare = useAtlasStore((s) => s.removeFromCompare);

  const seller = companies.find((c) => c.id === lot.sellerId);
  const totalUnits = lot.manifest.reduce((s, m) => s + m.qty, 0);
  const totalRetailValue = lot.manifest.reduce((s, m) => s + m.qty * m.unitRetailValue, 0);
  const bidCount = bids.filter((b) => b.lotId === lot.id && b.state !== 'Withdrawn').length;

  const landedCostPerUnit = estimateLandedCostPerUnit(lot, comparables);

  const inCompare = compareIds.includes(lot.id);
  const msLeft = new Date(lot.closesAt).getTime() - now;

  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/lots/${lot.id}`} className="text-sm font-semibold text-ink hover:text-primary">
          {lot.title}
        </Link>
        {lot.state === 'Live' && (
          <span className="whitespace-nowrap text-xs font-medium text-ink-muted">
            {msLeft > 0 ? `Closes in ${countdownText(msLeft)}` : 'Closing'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{lot.category}</Badge>
        <Badge tone="primary">{lot.grade}</Badge>
        {lot.buyNow && <Badge tone="info">Buy now available</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span>
          {totalUnits.toLocaleString()} units, {lot.cartons.length} cartons
        </span>
        <span>Retail value {aed(totalRetailValue)}</span>
        <span>Reserve not shown</span>
        <span>~{aed(landedCostPerUnit)} landed / unit</span>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-2 text-xs text-ink-muted">
        <span>
          {seller?.name && lot.showSellerName ? seller.name : `Verified distributor, ${lot.warehouse.area}`} · {Math.round((seller?.manifestAccuracy ?? 0) * 100)}% accuracy
        </span>
        <span>{bidCount} bids</span>
      </div>

      <div className="flex gap-2 pt-1">
        <Link href={`/lots/${lot.id}`} className="flex-1">
          <Button size="sm" variant="secondary" className="w-full">
            View lot
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => (inCompare ? removeFromCompare(lot.id) : addToCompare(lot.id))}
          disabled={!inCompare && compareIds.length >= 3}
          title={inCompare ? 'Remove from compare' : 'Add to compare'}
        >
          {inCompare ? <Check size={15} /> : <Plus size={15} />}
        </Button>
      </div>
    </div>
  );
}

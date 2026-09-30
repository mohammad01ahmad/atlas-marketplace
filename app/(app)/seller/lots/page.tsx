'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAtlasStore } from '@/lib/store';
import { rankBidsByNetValue, bidNetValue } from '@/lib/rules';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { aed, formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { LotState } from '@/types';

const TABS = ['Drafts', 'Under review', 'Live', 'Bidding closed', 'In deal', 'Completed', 'Unsold'] as const;
const TAB_STATE: Record<(typeof TABS)[number], LotState> = {
  Drafts: 'Draft',
  'Under review': 'Under review',
  Live: 'Live',
  'Bidding closed': 'Bidding closed',
  'In deal': 'In deal',
  Completed: 'Completed',
  Unsold: 'Unsold',
};

export default function MyLotsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Live');
  const activeSellerId = useAtlasStore((s) => s.activeSellerId);
  const allLots = useAtlasStore((s) => s.lots);
  const bids = useAtlasStore((s) => s.bids);
  const relistLot = useAtlasStore((s) => s.relistLot);

  const lots = allLots.filter((l) => l.sellerId === activeSellerId);
  const rows = lots.filter((l) => l.state === TAB_STATE[tab]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">My lots</h1>
        <Link href="/seller/lots/new">
          <Button size="sm" data-tour="create-listing-button">
            Create listing
          </Button>
        </Link>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {rows.length === 0 ? (
        <EmptyState text={`No lots in ${tab.toLowerCase()}.`} actionLabel="Create listing" actionHref="/seller/lots/new" />
      ) : (
        <ul className="divide-y divide-line rounded-[10px] border border-line bg-surface">
          {rows.map((lot) => {
            const lotBids = bids.filter((b) => b.lotId === lot.id && b.state !== 'Withdrawn');
            const bidCount = lotBids.length;
            const topBid = lot.state !== 'Live' && lot.state !== 'Under review' && lot.state !== 'Draft' ? rankBidsByNetValue(lotBids)[0] : undefined;
            const nextAction =
              lot.state === 'Draft'
                ? { label: 'Continue draft', href: `/seller/lots/new?draft=${lot.id}` }
                : lot.state === 'Bidding closed'
                  ? { label: 'Review bids', href: `/seller/lots/${lot.id}/bids` }
                  : undefined;
            return (
              <li key={lot.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/lots/${lot.id}`} className="text-sm font-medium text-ink hover:text-primary">
                    {lot.title}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {bidCount} bids{topBid && <> · highest net value {aed(bidNetValue(topBid))}</>} · closes {formatDateTime(lot.closesAt)}
                  </p>
                </div>
                {nextAction && (
                  <Link href={nextAction.href}>
                    <Button size="sm" variant="secondary">
                      {nextAction.label}
                    </Button>
                  </Link>
                )}
                {lot.state === 'Unsold' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      relistLot(lot.id);
                      toast(`${lot.id} relisted.`);
                    }}
                  >
                    Relist
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

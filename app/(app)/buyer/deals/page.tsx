'use client';

import Link from 'next/link';
import { useAtlasStore } from '@/lib/store';
import { StateBadge } from '@/components/ui/StateBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { aed, formatDateTime } from '@/lib/format';

export default function BuyerDealsPage() {
  const activeBuyerId = useAtlasStore((s) => s.activeBuyerId);
  const allDeals = useAtlasStore((s) => s.deals);
  const lots = useAtlasStore((s) => s.lots);
  const deals = allDeals.filter((d) => d.buyerId === activeBuyerId);
  const bids = useAtlasStore((s) => s.bids);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-ink">My deals</h1>
      {deals.length === 0 ? (
        <EmptyState text="No deals yet. Deals appear here once you win a lot." actionLabel="Browse lots" actionHref="/buyer/lots" />
      ) : (
        <ul className="divide-y divide-line rounded-[10px] border border-line bg-surface">
          {deals.map((deal) => {
            const lot = lots.find((l) => l.id === deal.lotId);
            const bid = bids.find((b) => b.id === deal.bidId);
            return (
              <li key={deal.id}>
                <Link href={`/buyer/deals/${deal.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-primary-soft">
                  <div>
                    <p className="text-sm font-medium text-ink">{lot?.title ?? deal.lotId}</p>
                    <p className="text-xs text-ink-muted tabular-nums">
                      {bid && aed(bid.amount)} · {deal.timeline[deal.timeline.length - 1] && formatDateTime(deal.timeline[deal.timeline.length - 1].at)}
                    </p>
                  </div>
                  <StateBadge state={deal.state} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

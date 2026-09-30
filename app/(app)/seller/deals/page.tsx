'use client';

import Link from 'next/link';
import { useAtlasStore } from '@/lib/store';
import { StateBadge } from '@/components/ui/StateBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/format';

export default function SellerDealsPage() {
  const activeSellerId = useAtlasStore((s) => s.activeSellerId);
  const allDeals = useAtlasStore((s) => s.deals);
  const lots = useAtlasStore((s) => s.lots);
  const companies = useAtlasStore((s) => s.companies);
  const deals = allDeals.filter((d) => d.sellerId === activeSellerId);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-ink">My deals</h1>
      {deals.length === 0 ? (
        <EmptyState text="No deals yet. Deals appear here once a bid is accepted." actionLabel="My lots" actionHref="/seller/lots" />
      ) : (
        <ul className="divide-y divide-line rounded-[10px] border border-line bg-surface">
          {deals.map((deal) => {
            const lot = lots.find((l) => l.id === deal.lotId);
            const buyer = companies.find((c) => c.id === deal.buyerId);
            return (
              <li key={deal.id}>
                <Link href={`/seller/deals/${deal.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-primary-soft">
                  <div>
                    <p className="text-sm font-medium text-ink">{lot?.title ?? deal.lotId}</p>
                    <p className="text-xs text-ink-muted">
                      {buyer?.name} · {deal.timeline[deal.timeline.length - 1] && formatDateTime(deal.timeline[deal.timeline.length - 1].at)}
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

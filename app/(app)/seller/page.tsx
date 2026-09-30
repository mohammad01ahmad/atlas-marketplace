'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Countdown } from '@/components/ui/Countdown';
import { aed, formatDateTime } from '@/lib/format';
import type { Category, LotState } from '@/types';

interface ActionItem {
  key: string;
  text: string;
  href: string;
  deadline?: string;
}

export default function SellerDashboard() {
  const activeSellerId = useAtlasStore((s) => s.activeSellerId);
  const seller = useAtlasStore((s) => s.companies.find((c) => c.id === activeSellerId));
  const allLots = useAtlasStore((s) => s.lots);
  const bids = useAtlasStore((s) => s.bids);
  const allDeals = useAtlasStore((s) => s.deals);
  const companies = useAtlasStore((s) => s.companies);
  const lots = allLots.filter((l) => l.sellerId === activeSellerId);
  const deals = allDeals.filter((d) => d.sellerId === activeSellerId);

  const items: ActionItem[] = [];
  for (const lot of lots) {
    if (lot.state === 'Bidding closed') {
      const count = bids.filter((b) => b.lotId === lot.id && b.state === 'Submitted').length;
      if (count > 0) items.push({ key: lot.id, text: `Review ${count} bid${count > 1 ? 's' : ''} for ${lot.id}`, href: `/seller/lots/${lot.id}/bids` });
    }
  }
  for (const deal of deals) {
    if (deal.state === 'Disputed' && deal.dispute && !deal.dispute.sellerResponse)
      items.push({ key: deal.id, text: `Respond to a dispute on ${deal.lotId}`, href: `/seller/deals/${deal.id}`, deadline: deal.dispute.respondBy });
    if (deal.state === 'Funded' || deal.state === 'Collection scheduled')
      items.push({ key: deal.id, text: `Prepare collection for ${deal.lotId}`, href: `/seller/deals/${deal.id}` });
  }
  items.sort((a, b) => (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity));

  const categories = Array.from(new Set(lots.map((l) => l.category)));
  const activeBuyersByCategory = categories.map((cat: Category) => ({
    category: cat,
    count: companies.filter((c) => c.role === 'buyer' && c.categories.includes(cat)).length,
  }));

  const stateCounts = lots.reduce<Partial<Record<LotState, number>>>((acc, l) => {
    acc[l.state] = (acc[l.state] ?? 0) + 1;
    return acc;
  }, {});

  const recentPayouts = deals
    .filter((d) => d.state === 'Completed' && d.payout)
    .sort((a, b) => new Date(b.timeline[b.timeline.length - 1]?.at ?? 0).getTime() - new Date(a.timeline[a.timeline.length - 1]?.at ?? 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">{seller?.name}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="primary" icon={ShieldCheck}>
          Licence verified
        </Badge>
        {activeBuyersByCategory.map((c) => (
          <span key={c.category} data-tour="active-buyers">
            <Badge tone="info">
              {c.count} verified buyers active in {c.category}
            </Badge>
          </span>
        ))}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Lots by state</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stateCounts).map(([state, count]) => (
            <Badge key={state}>
              {state}: {count}
            </Badge>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Action items</h2>
        {items.length === 0 ? (
          <EmptyState text="No action items right now. Anything needing your attention appears here." />
        ) : (
          <ul className="divide-y divide-line rounded-[10px] border border-line bg-surface">
            {items.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-primary-soft">
                  <span className="text-ink">{item.text}</span>
                  {item.deadline && <Countdown target={item.deadline} prefix="within" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Recent payouts</h2>
        {recentPayouts.length === 0 ? (
          <EmptyState text="No payouts yet. Completed deals appear here." />
        ) : (
          <ul className="divide-y divide-line rounded-[10px] border border-line bg-surface">
            {recentPayouts.map((deal) => (
              <li key={deal.id}>
                <Link href={`/seller/deals/${deal.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-primary-soft">
                  <span className="text-ink">{deal.lotId}</span>
                  <span className="tabular-nums font-medium text-ink">{deal.payout && aed(deal.payout.net)}</span>
                  <span className="text-xs text-ink-muted">{formatDateTime(deal.timeline[deal.timeline.length - 1]?.at ?? '')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

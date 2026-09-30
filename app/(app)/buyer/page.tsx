'use client';

import Link from 'next/link';
import { ShieldCheck, Wallet } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Countdown } from '@/components/ui/Countdown';
import { LotCard } from '@/components/lot/LotCard';
import { aed } from '@/lib/format';

interface ActionItem {
  key: string;
  text: string;
  href: string;
  deadline?: string;
}

export default function BuyerDashboard() {
  const activeBuyerId = useAtlasStore((s) => s.activeBuyerId);
  const buyer = useAtlasStore((s) => s.companies.find((c) => c.id === activeBuyerId));
  const allDeals = useAtlasStore((s) => s.deals);
  const allBids = useAtlasStore((s) => s.bids);
  const lots = useAtlasStore((s) => s.lots);
  const allSavedSearches = useAtlasStore((s) => s.savedSearches);
  const deals = allDeals.filter((d) => d.buyerId === activeBuyerId);
  const bids = allBids.filter((b) => b.buyerId === activeBuyerId);
  const savedSearches = allSavedSearches.filter((s) => s.buyerId === activeBuyerId);

  const items: ActionItem[] = [];
  for (const deal of deals) {
    if (deal.state === 'Awarded') items.push({ key: deal.id, text: `Fund escrow for ${deal.lotId}`, href: `/buyer/deals/${deal.id}`, deadline: deal.fundBy });
    if (deal.state === 'Funded') items.push({ key: deal.id, text: `Book a collection slot for ${deal.lotId}`, href: `/buyer/deals/${deal.id}` });
    if (deal.state === 'Collection scheduled') items.push({ key: deal.id, text: `Count the stock for ${deal.lotId}`, href: `/buyer/deals/${deal.id}/count` });
    if (deal.state === 'Counted') items.push({ key: deal.id, text: `Decide on ${deal.lotId}: accept the credit or reject the lot`, href: `/buyer/deals/${deal.id}` });
    if (deal.state === 'Disputed' && deal.dispute?.sellerResponse === 'Partial credit' && !deal.dispute.resolution)
      items.push({ key: deal.id, text: `Respond to the seller's partial credit offer for ${deal.lotId}`, href: `/buyer/deals/${deal.id}` });
  }
  for (const bid of bids) {
    if (bid.state === 'Countered' && bid.counterRespondBy) items.push({ key: bid.id, text: `Respond to a counter on ${bid.lotId}`, href: '/buyer/bids', deadline: bid.counterRespondBy });
    if (bid.state === 'Best and final requested' && bid.bestAndFinalRespondBy)
      items.push({ key: bid.id, text: `Submit best and final for ${bid.lotId}`, href: '/buyer/bids', deadline: bid.bestAndFinalRespondBy });
  }
  items.sort((a, b) => (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity));

  const activeBids = bids.filter((b) => b.state === 'Submitted').map((b) => ({ bid: b, lot: lots.find((l) => l.id === b.lotId) })).filter((x) => x.lot?.state === 'Live');

  const savedSearchLots = savedSearches.flatMap((search) =>
    lots.filter(
      (l) =>
        l.state === 'Live' &&
        (!search.filters.category || l.category === search.filters.category) &&
        (!search.filters.grade || l.grade === search.filters.grade) &&
        (!search.filters.emirate || l.warehouse.emirate === search.filters.emirate),
    ),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">{buyer?.name}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="primary" icon={ShieldCheck}>
          Licence verified
        </Badge>
        <Badge tone="info" icon={Wallet}>
          Deposit balance available: {aed(buyer?.depositBalance ?? 0)}
        </Badge>
      </div>

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
        <h2 className="mb-2 text-sm font-semibold text-ink">Active bids</h2>
        {activeBids.length === 0 ? (
          <EmptyState text="No active bids yet. Lots you bid on appear here." actionLabel="Browse lots" actionHref="/buyer/lots" />
        ) : (
          <ul className="divide-y divide-line rounded-[10px] border border-line bg-surface">
            {activeBids.map(({ bid, lot }) => (
              <li key={bid.id}>
                <Link href={`/lots/${bid.lotId}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-primary-soft">
                  <span className="text-ink">
                    {lot?.title} — {aed(bid.amount)}
                  </span>
                  {lot && <Countdown target={lot.closesAt} prefix="closes in" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {savedSearchLots.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Matching your saved searches</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedSearchLots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

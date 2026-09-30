'use client';

import { use } from 'react';
import { useAtlasStore } from '@/lib/store';
import { DealTimeline } from '@/components/deal/DealTimeline';
import { NextStepPanel } from '@/components/deal/NextStepPanel';
import { DisputePanel } from '@/components/deal/DisputePanel';
import { PayoutPanel } from '@/components/deal/PayoutPanel';
import { MoneyRow } from '@/components/ui/MoneyRow';
import { Countdown } from '@/components/ui/Countdown';
import { formatDateTime } from '@/lib/format';

export default function SellerDealTrackerPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = use(params);
  const deal = useAtlasStore((s) => s.deals.find((d) => d.id === dealId));
  const lot = useAtlasStore((s) => s.lots.find((l) => l.id === deal?.lotId));
  const bid = useAtlasStore((s) => s.bids.find((b) => b.id === deal?.bidId));
  const backupBid = useAtlasStore((s) => (lot?.backupBidId ? s.bids.find((b) => b.id === lot.backupBidId) : undefined));
  const buyer = useAtlasStore((s) => s.companies.find((c) => c.id === deal?.buyerId));
  const backupBuyer = useAtlasStore((s) => (backupBid ? s.companies.find((c) => c.id === backupBid.buyerId) : undefined));

  if (!deal || !lot || !bid) return <p className="text-sm text-ink-muted">Deal not found.</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">{lot.title}</h1>
        <p className="text-sm text-ink-muted">
          {deal.id} · {buyer?.name}
        </p>
      </div>

      <DealTimeline deal={deal} />

      {deal.state === 'Awarded' && (
        <>
          <NextStepPanel text="Awaiting the buyer's escrow funding." />
          <div className="space-y-2 rounded-[10px] border border-line bg-surface p-4">
            <Countdown target={deal.fundBy} prefix="Funding due within" />
            {backupBid && backupBuyer && <p className="text-sm text-ink-muted">Backup bidder: {backupBuyer.name}</p>}
          </div>
        </>
      )}

      {deal.state === 'Funded' && (
        <>
          <NextStepPanel text="Prepare the collection. The buyer will book a slot shortly." />
        </>
      )}

      {deal.state === 'Collection scheduled' && (
        <>
          <NextStepPanel text="Prepare the stock for the buyer's booked collection slot." />
          <div className="rounded-[10px] border border-line bg-surface p-4">
            <p className="text-sm text-ink-muted">Booked slot</p>
            <p className="text-sm font-medium text-ink">{deal.collectionSlot && formatDateTime(deal.collectionSlot)}</p>
          </div>
        </>
      )}

      {(deal.state === 'Counted' || deal.state === 'Inspection window') && deal.count && (
        <>
          <NextStepPanel text="The buyer has counted the stock. Review the outcome below." />
          <div className="space-y-1 rounded-[10px] border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between py-1 text-sm">
              <span className="text-ink-muted">Shortage by value</span>
              <span className="font-medium tabular-nums">{(deal.count.shortagePct * 100).toFixed(2)}%</span>
            </div>
            <MoneyRow label="Price adjustment" amount={deal.count.creditAmount} strong />
          </div>
          {deal.state === 'Inspection window' && deal.inspectionEndsAt && <Countdown target={deal.inspectionEndsAt} prefix="Inspection window closes in" />}
        </>
      )}

      {(deal.state === 'Disputed' || deal.state === 'Resolved') && <DisputePanel dealId={dealId} role="seller" />}

      {deal.state === 'Rejected' && (
        <div className="rounded-[10px] border border-line bg-surface p-4">
          <p className="text-sm text-ink">The buyer rejected this lot at collection. A full refund was issued and this lot returned to Unsold.</p>
        </div>
      )}

      {deal.state === 'Unfunded' && (
        <div className="rounded-[10px] border border-line bg-surface p-4">
          <p className="text-sm text-ink">
            The buyer missed the funding deadline. {backupBuyer ? `Offered to the backup bidder, ${backupBuyer.name}.` : 'No backup bidder was available.'}
          </p>
        </div>
      )}

      {deal.state === 'Completed' && deal.payout && <PayoutPanel payout={deal.payout} />}
    </div>
  );
}

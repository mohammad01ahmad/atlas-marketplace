'use client';

import { use } from 'react';
import { useAtlasStore } from '@/lib/store';
import { calcAmountToFund } from '@/lib/rules';
import { formatDateTime } from '@/lib/format';
import { DealTimeline } from '@/components/deal/DealTimeline';
import { NextStepPanel } from '@/components/deal/NextStepPanel';
import { DisputePanel } from '@/components/deal/DisputePanel';
import { PayoutPanel } from '@/components/deal/PayoutPanel';
import { MoneyRow } from '@/components/ui/MoneyRow';
import { Countdown } from '@/components/ui/Countdown';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SealTag } from '@/components/ui/SealTag';
import { toast } from '@/lib/toast';

const MOCK_SLOTS_OFFSETS_H = [24, 30, 48, 54, 72];

export default function BuyerDealTrackerPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = use(params);
  const deal = useAtlasStore((s) => s.deals.find((d) => d.id === dealId));
  const lot = useAtlasStore((s) => s.lots.find((l) => l.id === deal?.lotId));
  const bid = useAtlasStore((s) => s.bids.find((b) => b.id === deal?.bidId));
  const now = useAtlasStore((s) => s.clockBaseMs + s.clockOffsetMs);
  const fundEscrow = useAtlasStore((s) => s.fundEscrow);
  const bookCollectionSlot = useAtlasStore((s) => s.bookCollectionSlot);
  const rejectLot = useAtlasStore((s) => s.rejectLot);
  const acceptCollectionCredit = useAtlasStore((s) => s.acceptCollectionCredit);

  if (!deal || !lot || !bid) return <p className="text-sm text-ink-muted">Deal not found.</p>;

  const amountToFund = calcAmountToFund(bid.amount, deal.deliveryFee, bid.deposit);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">{lot.title}</h1>
        <p className="text-sm text-ink-muted">{deal.id}</p>
      </div>

      <DealTimeline deal={deal} />

      {deal.state === 'Awarded' && (
        <>
          <NextStepPanel
            text={`Fund escrow within the 48 hour window or the lot may be offered to the backup bidder.`}
            actionLabel="Fund escrow"
            onAction={() => {
              const res = fundEscrow(dealId);
              if (res.ok) toast('Escrow funded.');
              else toast(res.error ?? 'Could not fund escrow.');
            }}
          />
          <div className="space-y-1 rounded-[10px] border border-line bg-surface p-4">
            <MoneyRow label="Winning bid" amount={bid.amount} muted />
            <MoneyRow label="Deposit already held" amount={-bid.deposit} muted />
            <MoneyRow label="Amount to fund" amount={amountToFund} strong />
            <div className="pt-2">
              <Countdown target={deal.fundBy} prefix="Fund escrow within" />
            </div>
          </div>
        </>
      )}

      {deal.state === 'Funded' && (
        <>
          <NextStepPanel text="Book a collection slot at the warehouse." />
          <div className="space-y-2 rounded-[10px] border border-line bg-surface p-4">
            <p className="text-sm font-medium text-ink">Choose a collection slot</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MOCK_SLOTS_OFFSETS_H.map((h) => {
                const iso = new Date(now + h * 3600_000).toISOString();
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      bookCollectionSlot(dealId, iso);
                      toast('Collection slot booked.');
                    }}
                    className="rounded-md border border-line bg-paper px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary-soft"
                  >
                    {formatDateTime(iso)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {deal.state === 'Collection scheduled' && (
        <>
          <NextStepPanel
            text={`Collect the stock at ${lot.warehouse.area}, ${lot.warehouse.emirate} and count it against the seals.`}
            actionLabel="Count the stock"
            href={`/buyer/deals/${dealId}/count`}
          />
          <div className="space-y-3 rounded-[10px] border border-line bg-surface p-4">
            <div>
              <p className="text-xs font-medium text-ink-muted">Warehouse</p>
              <p className="text-sm text-ink">
                {lot.warehouse.area}, {lot.warehouse.emirate}
              </p>
            </div>
            <p className="text-sm text-ink-muted">Slot: {deal.collectionSlot && formatDateTime(deal.collectionSlot)}</p>
            <p className="text-sm text-ink-muted">Bring: collection authorisation, company stamp, and this deal reference.</p>
            <div>
              <p className="mb-1.5 text-xs font-medium text-ink-muted">Seals to check</p>
              <div className="flex flex-wrap gap-1.5">
                {lot.cartons.slice(0, 12).map((c) => (
                  <SealTag key={c.sealId} sealId={c.sealId} />
                ))}
                {lot.cartons.length > 12 && <span className="self-center text-xs text-ink-muted">+{lot.cartons.length - 12} more</span>}
              </div>
            </div>
          </div>
        </>
      )}

      {deal.state === 'Counted' && deal.count && (
        <>
          <NextStepPanel text="A shortage over the automatic threshold was found. Accept the credit or reject the lot for a full refund." />
          <CountedSummary deal={deal} />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                acceptCollectionCredit(dealId);
                toast('Accepted with credit.');
              }}
            >
              Accept with credit
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                rejectLot(dealId);
                toast('Lot rejected. Full refund issued.');
              }}
            >
              Reject lot
            </Button>
          </div>
        </>
      )}

      {deal.state === 'Inspection window' && deal.count && (
        <>
          <NextStepPanel text="The inspection window is open. Raise a dispute if something is wrong, or wait for it to close." />
          <CountedSummary deal={deal} />
          {deal.inspectionEndsAt && (
            <p className="text-sm text-ink-muted">
              <Countdown target={deal.inspectionEndsAt} prefix="Inspection window closes in" />
            </p>
          )}
          <DisputePanel dealId={dealId} role="buyer" />
        </>
      )}

      {deal.state === 'Disputed' || deal.state === 'Resolved' ? <DisputePanel dealId={dealId} role="buyer" /> : null}

      {deal.state === 'Rejected' && (
        <div className="rounded-[10px] border border-line bg-surface p-4">
          <p className="text-sm text-ink">This lot was rejected at collection. Your deposit and any payment were refunded in full.</p>
        </div>
      )}

      {deal.state === 'Unfunded' && (
        <div className="rounded-[10px] border border-line bg-surface p-4">
          <p className="text-sm text-ink">The funding window closed before payment. Your deposit was forfeited and the lot moved to the backup bidder.</p>
        </div>
      )}

      {deal.state === 'Completed' && deal.payout && (
        <>
          <div className="rounded-[10px] border border-line bg-surface p-4">
            <p className="mb-2 text-sm font-semibold">Documents</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">Tax invoice</Badge>
              <Badge tone="primary">Count record</Badge>
            </div>
          </div>
          <MoneyRow label="Final amount" amount={bid.amount - deal.payout.credit} strong />
          {deal.payout.credit > 0 && <MoneyRow label="Credit applied" amount={deal.payout.credit} muted />}
        </>
      )}
    </div>
  );
}

function CountedSummary({ deal }: { deal: { count?: { shortagePct: number; creditAmount: number; outcome: string } } }) {
  if (!deal.count) return null;
  return (
    <div className="space-y-1 rounded-[10px] border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between py-1 text-sm">
        <span className="text-ink-muted">Shortage by value</span>
        <span className="font-medium tabular-nums">{(deal.count.shortagePct * 100).toFixed(2)}%</span>
      </div>
      <MoneyRow label="Credit" amount={deal.count.creditAmount} strong />
    </div>
  );
}

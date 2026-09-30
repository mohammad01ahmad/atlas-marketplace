'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtlasStore } from '@/lib/store';
import { BidRanking } from '@/components/bid/BidRanking';
import { CounterDialog } from '@/components/bid/CounterDialog';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { StateBadge } from '@/components/ui/StateBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/lib/toast';

export default function BidReviewPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const router = useRouter();
  const lot = useAtlasStore((s) => s.lots.find((l) => l.id === lotId));
  const companies = useAtlasStore((s) => s.companies);
  const allBids = useAtlasStore((s) => s.bids);
  const bids = allBids.filter((b) => b.lotId === lotId);
  const acceptBid = useAtlasStore((s) => s.acceptBid);
  const counterBid = useAtlasStore((s) => s.counterBid);
  const callBestAndFinal = useAtlasStore((s) => s.callBestAndFinal);
  const relistLot = useAtlasStore((s) => s.relistLot);
  const markUnsold = useAtlasStore((s) => s.markUnsold);

  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [bafOpen, setBafOpen] = useState(false);
  const [threshold, setThreshold] = useState(0);

  if (!lot) return <p className="text-sm text-ink-muted">Lot not found.</p>;

  if (lot.state !== 'Bidding closed' && lot.state !== 'Unsold') {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-ink">{lot.title}</h1>
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          Bid review opens once bidding closes. Current state: <StateBadge state={lot.state} />
        </p>
      </div>
    );
  }

  if (lot.state === 'Unsold') {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-ink">{lot.title}</h1>
        <p className="text-sm text-ink-muted">No bid met the reserve. Relist to reopen bidding.</p>
        <Button
          onClick={() => {
            relistLot(lot.id);
            toast(`${lot.id} relisted.`);
            router.push('/seller/lots');
          }}
        >
          Relist
        </Button>
      </div>
    );
  }

  const submittedBids = bids.filter((b) => b.state === 'Submitted');
  const totalRetailValue = lot.manifest.reduce((s, m) => s + m.qty * m.unitRetailValue, 0);
  const counterBidObj = bids.find((b) => b.id === counterFor);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">{lot.title}</h1>
        <p className="text-sm text-ink-muted">{submittedBids.length} bids awaiting a decision</p>
      </div>

      {submittedBids.length === 0 ? (
        <EmptyState text="No bids to review. If reserve was not met, relist this lot." actionLabel="Relist" actionHref="/seller/lots" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setBafOpen(true)}>
              Call best and final
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                markUnsold(lot.id);
                toast(`${lot.id} marked unsold.`);
                router.push('/seller/lots');
              }}
            >
              Relist
            </Button>
          </div>

          <BidRanking
            lot={lot}
            bids={bids}
            companies={companies}
            totalRetailValue={totalRetailValue}
            onAccept={(bidId) => {
              acceptBid(lot.id, bidId);
              toast('Bid accepted.');
              router.push('/seller/deals');
            }}
            onCounter={(bidId) => setCounterFor(bidId)}
          />
        </>
      )}

      <CounterDialog
        open={!!counterFor}
        onClose={() => setCounterFor(null)}
        currentAmount={counterBidObj?.amount ?? 0}
        onSubmit={(amount) => {
          if (!counterFor) return;
          const res = counterBid(lot.id, counterFor, amount);
          if (res.ok) toast('Counter sent.');
          else toast(res.error ?? 'Could not send counter.');
        }}
      />

      <Dialog open={bafOpen} onClose={() => setBafOpen(false)} title="Call best and final">
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">All bids above this threshold get one final round, with a 24 hour response window.</p>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value) || 0)}
            className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
          />
          <Button
            className="w-full"
            onClick={() => {
              callBestAndFinal(lot.id, threshold);
              toast('Best and final round called.');
              setBafOpen(false);
            }}
          >
            Call round
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

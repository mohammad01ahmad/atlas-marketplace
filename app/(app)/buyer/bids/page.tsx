'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAtlasStore } from '@/lib/store';
import { Tabs } from '@/components/ui/Tabs';
import { StateBadge } from '@/components/ui/StateBadge';
import { Countdown } from '@/components/ui/Countdown';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog } from '@/components/ui/Dialog';
import { aed, formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { Bid } from '@/types';

const TABS = ['Active', 'Won', 'Lost', 'Withdrawn'] as const;

export default function MyBidsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Active');
  const activeBuyerId = useAtlasStore((s) => s.activeBuyerId);
  const allBids = useAtlasStore((s) => s.bids);
  const lots = useAtlasStore((s) => s.lots);
  const deals = useAtlasStore((s) => s.deals);
  const bids = allBids.filter((b) => b.buyerId === activeBuyerId);
  const raiseBid = useAtlasStore((s) => s.raiseBid);
  const respondToCounter = useAtlasStore((s) => s.respondToCounter);
  const respondToBestAndFinal = useAtlasStore((s) => s.respondToBestAndFinal);

  const [raiseTarget, setRaiseTarget] = useState<Bid | null>(null);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [counterTarget, setCounterTarget] = useState<Bid | null>(null);
  const [bafTarget, setBafTarget] = useState<Bid | null>(null);
  const [bafAmount, setBafAmount] = useState(0);

  const grouped: Record<(typeof TABS)[number], Bid[]> = {
    Active: bids.filter((b) => b.state === 'Submitted' || b.state === 'Countered' || b.state === 'Best and final requested' || b.state === 'Backup'),
    Won: bids.filter((b) => b.state === 'Won'),
    Lost: bids.filter((b) => b.state === 'Lost'),
    Withdrawn: bids.filter((b) => b.state === 'Withdrawn'),
  };

  const rows = grouped[tab];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-ink">My bids</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {rows.length === 0 ? (
        <EmptyState text="No bids here yet. Lots you bid on appear here." actionLabel="Browse lots" actionHref="/buyer/lots" />
      ) : (
        <ul className="divide-y divide-line rounded-[10px] border border-line bg-surface">
          {rows.map((bid) => {
            const lot = lots.find((l) => l.id === bid.lotId);
            const deal = deals.find((d) => d.bidId === bid.id);
            return (
              <li key={bid.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/lots/${bid.lotId}`} className="text-sm font-medium text-ink hover:text-primary">
                    {lot?.title ?? bid.lotId}
                  </Link>
                  <p className="text-xs text-ink-muted tabular-nums">
                    {aed(bid.amount)} · <StateBadge state={bid.state} />
                    {lot?.state === 'Live' && <> · closes {formatDateTime(lot.closesAt)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {bid.state === 'Submitted' && lot?.state === 'Live' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setRaiseTarget(bid);
                        setRaiseAmount(bid.amount + 1000);
                      }}
                    >
                      Raise bid
                    </Button>
                  )}
                  {bid.state === 'Countered' && (
                    <>
                      {bid.counterRespondBy && <Countdown target={bid.counterRespondBy} prefix="respond within" />}
                      <Button size="sm" onClick={() => setCounterTarget(bid)}>
                        Respond to counter
                      </Button>
                    </>
                  )}
                  {bid.state === 'Best and final requested' && (
                    <>
                      {bid.bestAndFinalRespondBy && <Countdown target={bid.bestAndFinalRespondBy} prefix="respond within" />}
                      <Button
                        size="sm"
                        onClick={() => {
                          setBafTarget(bid);
                          setBafAmount(bid.amount);
                        }}
                      >
                        Submit best and final
                      </Button>
                    </>
                  )}
                  {bid.state === 'Won' && deal?.state === 'Awarded' && (
                    <Link href={`/buyer/deals/${deal.id}`}>
                      <Button size="sm">Fund escrow</Button>
                    </Link>
                  )}
                  {bid.state === 'Won' && deal && deal.state !== 'Awarded' && (
                    <Link href={`/buyer/deals/${deal.id}`}>
                      <Button size="sm" variant="secondary">
                        View deal
                      </Button>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!raiseTarget} onClose={() => setRaiseTarget(null)} title="Raise bid">
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">Your current bid is {raiseTarget && aed(raiseTarget.amount)}. You can raise it, never lower it.</p>
          <input
            type="number"
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value) || 0)}
            className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
          />
          <Button
            className="w-full"
            onClick={() => {
              if (!raiseTarget) return;
              const res = raiseBid(raiseTarget.id, raiseAmount);
              if (res.ok) {
                toast('Bid raised.');
                setRaiseTarget(null);
              } else {
                toast(res.error ?? 'Could not raise bid.');
              }
            }}
          >
            Raise bid
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!counterTarget} onClose={() => setCounterTarget(null)} title="Respond to counter">
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">
            The seller countered at {counterTarget && aed(counterTarget.counterAmount ?? 0)}. Accepting matches your bid to this amount.
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                if (!counterTarget) return;
                respondToCounter(counterTarget.id, true);
                toast('Counter accepted.');
                setCounterTarget(null);
              }}
            >
              Accept
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                if (!counterTarget) return;
                respondToCounter(counterTarget.id, false);
                toast('Counter declined.');
                setCounterTarget(null);
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!bafTarget} onClose={() => setBafTarget(null)} title="Submit best and final">
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">This is your last chance to raise your bid before the seller decides.</p>
          <input
            type="number"
            value={bafAmount}
            onChange={(e) => setBafAmount(Number(e.target.value) || 0)}
            className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
          />
          <Button
            className="w-full"
            onClick={() => {
              if (!bafTarget) return;
              const res = respondToBestAndFinal(bafTarget.id, bafAmount);
              if (res.ok) {
                toast('Best and final submitted.');
                setBafTarget(null);
              } else {
                toast(res.error ?? 'Could not submit.');
              }
            }}
          >
            Submit
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

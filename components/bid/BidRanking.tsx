'use client';

import { AlertTriangle } from 'lucide-react';
import type { Bid, Company, Lot } from '@/types';
import { rankBidsByNetValue, bidNetValue, calcCommission, calcRecoveryPct, reserveMet } from '@/lib/rules';
import { aed, pct, formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function BidRanking({
  lot,
  bids,
  companies,
  totalRetailValue,
  onAccept,
  onCounter,
}: {
  lot: Lot;
  bids: Bid[];
  companies: Company[];
  totalRetailValue: number;
  onAccept: (bidId: string) => void;
  onCounter: (bidId: string) => void;
}) {
  const ranked = rankBidsByNetValue(bids);
  const top3Ids = new Set(ranked.slice(0, 3).map((b) => b.id));

  return (
    <div className="overflow-x-auto rounded-[10px] border border-line" data-tour="bid-ranking">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-paper text-left text-xs font-medium text-ink-muted">
            <th className="px-3 py-2">Buyer</th>
            <th className="px-3 py-2 text-right">Bid</th>
            <th className="px-3 py-2 text-right">Commission</th>
            <th className="px-3 py-2 text-right">Net value</th>
            <th className="px-3 py-2 text-right">Recovery</th>
            <th className="px-3 py-2">Terms</th>
            <th className="px-3 py-2">Reserve met</th>
            <th className="px-3 py-2" data-tour="bid-actions">
              Decision
            </th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((bid) => {
            const buyer = companies.find((c) => c.id === bid.buyerId);
            const commission = calcCommission(bid.amount);
            const net = bidNetValue(bid);
            const recovery = calcRecoveryPct(bid.amount, totalRetailValue);
            const met = reserveMet(bid, lot);
            return (
              <tr key={bid.id} className="border-b border-line last:border-0 align-top">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-ink">{buyer?.name}</p>
                  <p className="text-xs text-ink-muted">
                    {buyer?.marketsServed?.join(', ')} · {Math.round((buyer?.completionRate ?? 0) * 100)}% completion
                    {buyer && buyer.strikes.length > 0 ? ` · ${buyer.strikes.length} strike${buyer.strikes.length > 1 ? 's' : ''}` : ''}
                  </p>
                  {bid.conditionConflict && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger">
                      <AlertTriangle size={12} /> {bid.conditionConflict}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{aed(bid.amount)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">{aed(commission)}</td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">{aed(net)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{pct(recovery, 1)}</td>
                <td className="px-3 py-2.5 text-xs text-ink-muted">
                  {formatDate(bid.collectionDate)} · {bid.destination}
                  <br />
                  {bid.conditionsAccepted ? 'Conditions accepted' : 'Conditions not accepted'}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={met ? 'primary' : 'neutral'}>{met ? 'Yes' : 'No'}</Badge>
                </td>
                <td className="px-3 py-2.5">
                  {bid.state === 'Submitted' && (
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" onClick={() => onAccept(bid.id)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="secondary" disabled={!top3Ids.has(bid.id) || bid.counterUsed} onClick={() => onCounter(bid.id)}>
                        Counter
                      </Button>
                    </div>
                  )}
                  {bid.state !== 'Submitted' && <Badge>{bid.state}</Badge>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

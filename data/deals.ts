// Mock deals, PRD 10.3: LOT-1038 (In deal, collection booked) and LOT-1029
// (Completed, with a 3.1% shortage credit kept for profile history).

import type { Deal } from '@/types';
import { isoAt } from '@/lib/clock';
import { calcCommission, calcNetToSeller, calcFinalPayout } from '@/lib/rules';

export function createSeedDeals(baseMs: number): Deal[] {
  const deal1038: Deal = {
    id: 'DEAL-1038',
    lotId: 'LOT-1038',
    bidId: 'BID-1038-b1',
    buyerId: 'b1',
    sellerId: 's1',
    state: 'Collection scheduled',
    fundBy: isoAt(baseMs, -24 * 11),
    delivery: 'Collection',
    deliveryFee: 0,
    collectionSlot: isoAt(baseMs, 24),
    timeline: [
      { state: 'Awarded', at: isoAt(baseMs, -24 * 13) },
      { state: 'Funded', at: isoAt(baseMs, -24 * 12) },
      { state: 'Collection scheduled', at: isoAt(baseMs, -24 * 11) },
    ],
  };

  const winningBid1029 = 40_000;
  const shortageValue1029 = 22 * 280; // 22 air fryers short (700 expected, 678 received) at AED 280 each
  const pct1029 = shortageValue1029 / 196_000;
  const credit1029 = winningBid1029 * pct1029;
  const commission1029 = calcCommission(winningBid1029);
  const net1029 = calcNetToSeller(winningBid1029);
  const finalPayout1029 = calcFinalPayout(net1029, credit1029);

  const deal1029: Deal = {
    id: 'DEAL-1029',
    lotId: 'LOT-1029',
    bidId: 'BID-1029-b5',
    buyerId: 'b5',
    sellerId: 's3',
    state: 'Completed',
    fundBy: isoAt(baseMs, -24 * 39),
    delivery: 'Collection',
    deliveryFee: 0,
    collectionSlot: isoAt(baseMs, -24 * 35),
    count: {
      seals: Array.from({ length: 35 }, (_, i) => ({ sealId: `S-${7_101 + i}`, intact: true })),
      lines: [{ sku: 'AF-5L', received: 678, belowGrade: 0 }],
      shortagePct: pct1029,
      creditAmount: credit1029,
      outcome: 'Credit with score impact',
    },
    inspectionEndsAt: isoAt(baseMs, -24 * 31),
    payout: {
      gross: winningBid1029,
      credit: credit1029,
      commission: commission1029,
      net: finalPayout1029,
    },
    timeline: [
      { state: 'Awarded', at: isoAt(baseMs, -24 * 39) },
      { state: 'Funded', at: isoAt(baseMs, -24 * 38) },
      { state: 'Collection scheduled', at: isoAt(baseMs, -24 * 36) },
      { state: 'Counted', at: isoAt(baseMs, -24 * 34) },
      { state: 'Inspection window', at: isoAt(baseMs, -24 * 34) },
      { state: 'Completed', at: isoAt(baseMs, -24 * 31) },
    ],
  };

  return [deal1038, deal1029];
}

// Mock bids, PRD 10.3 (LOT-1042 bid table) plus the bids behind the two
// pre-seeded deals (LOT-1038, LOT-1029).

import type { Bid } from '@/types';
import { calcDeposit, findConditionConflict } from '@/lib/rules';
import { isoAt } from '@/lib/clock';

export function createSeedBids(baseMs: number): Bid[] {
  const lot1042Conditions = ['Export only'];

  const lot1042Bids: Bid[] = [
    {
      id: 'BID-1042-b1',
      lotId: 'LOT-1042',
      buyerId: 'b1',
      amount: 205_000,
      collectionDate: isoAt(baseMs, 24 * 2),
      destination: 'Kenya',
      conditionsAccepted: true,
      deposit: calcDeposit(205_000),
      state: 'Submitted',
      history: [{ at: isoAt(baseMs, -24 * 4), amount: 205_000 }],
    },
    {
      id: 'BID-1042-b3',
      lotId: 'LOT-1042',
      buyerId: 'b3',
      amount: 212_000,
      collectionDate: isoAt(baseMs, 24 * 5),
      destination: 'Pakistan',
      conditionsAccepted: true,
      deposit: calcDeposit(212_000),
      state: 'Submitted',
      history: [{ at: isoAt(baseMs, -24 * 3), amount: 212_000 }],
    },
    {
      id: 'BID-1042-b4',
      lotId: 'LOT-1042',
      buyerId: 'b4',
      amount: 198_000,
      collectionDate: isoAt(baseMs, 24 * 1),
      destination: 'Uzbekistan',
      conditionsAccepted: true,
      deposit: calcDeposit(198_000),
      state: 'Submitted',
      history: [{ at: isoAt(baseMs, -24 * 5), amount: 198_000 }],
    },
    {
      id: 'BID-1042-b6',
      lotId: 'LOT-1042',
      buyerId: 'b6',
      amount: 184_000,
      collectionDate: isoAt(baseMs, 24 * 3),
      destination: 'Egypt',
      conditionsAccepted: true,
      deposit: calcDeposit(184_000),
      state: 'Submitted',
      history: [{ at: isoAt(baseMs, -24 * 4), amount: 184_000 }],
    },
    {
      id: 'BID-1042-b2',
      lotId: 'LOT-1042',
      buyerId: 'b2',
      amount: 176_000,
      collectionDate: isoAt(baseMs, 24 * 1),
      destination: 'UAE, Oman',
      conditionsAccepted: true,
      conditionConflict: findConditionConflict('UAE, Oman', lot1042Conditions),
      deposit: calcDeposit(176_000),
      state: 'Submitted',
      history: [{ at: isoAt(baseMs, -24 * 6), amount: 176_000 }],
    },
  ];

  const dealBids: Bid[] = [
    {
      id: 'BID-1038-b1',
      lotId: 'LOT-1038',
      buyerId: 'b1',
      amount: 95_000,
      collectionDate: isoAt(baseMs, 24),
      destination: 'Kenya',
      conditionsAccepted: true,
      deposit: calcDeposit(95_000),
      state: 'Won',
      history: [{ at: isoAt(baseMs, -24 * 15), amount: 95_000 }],
    },
    {
      id: 'BID-1029-b5',
      lotId: 'LOT-1029',
      buyerId: 'b5',
      amount: 40_000,
      collectionDate: isoAt(baseMs, -24 * 35),
      destination: 'UAE',
      conditionsAccepted: true,
      deposit: calcDeposit(40_000),
      state: 'Won',
      history: [{ at: isoAt(baseMs, -24 * 41), amount: 40_000 }],
    },
  ];

  return [...lot1042Bids, ...dealBids];
}

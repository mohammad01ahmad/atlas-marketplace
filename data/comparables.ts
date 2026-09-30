// Recovery benchmark comparables, PRD 10.3.

import type { Comparable } from '@/types';
import { isoAt } from '@/lib/clock';

const TABLE: { category: Comparable['category']; grade: Comparable['grade']; recoveries: number[] }[] = [
  { category: 'Electronics', grade: 'New sealed', recoveries: [19, 21, 23, 24, 26] },
  { category: 'Electronics', grade: 'New open box', recoveries: [14, 16, 17, 19] },
  { category: 'Electronics', grade: 'Returns tested', recoveries: [10, 12, 13] },
  { category: 'Cosmetics', grade: 'New sealed', recoveries: [16, 18, 20, 22] },
  { category: 'Household', grade: 'New sealed', recoveries: [17, 19, 20] },
  { category: 'Apparel', grade: 'New sealed', recoveries: [15, 17, 18, 21] },
];

export function createComparables(baseMs: number): Comparable[] {
  const comparables: Comparable[] = [];
  let dayOffset = 5;
  for (const row of TABLE) {
    for (const recovery of row.recoveries) {
      comparables.push({
        category: row.category,
        grade: row.grade,
        closedAt: isoAt(baseMs, -24 * dayOffset),
        recoveryPct: recovery / 100,
      });
      dayOffset += 6;
    }
  }
  return comparables;
}

export function comparablesFor(
  all: Comparable[],
  category: Comparable['category'],
  grade: Comparable['grade'],
): Comparable[] {
  return all.filter((c) => c.category === category && c.grade === grade);
}

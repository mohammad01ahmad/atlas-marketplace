// Business rules: money calculations (PRD 9.5) and the collection outcome /
// tolerance table (PRD 9.4). Pure functions, no store or clock dependency.

import type { Bid, Comparable, Lot } from '@/types';
import { comparablesFor } from '@/data/comparables';

// ---- 9.5 Money calculations ----------------------------------------------

export function calcDeposit(bidAmount: number): number {
  return Math.max(2000, 0.05 * bidAmount);
}

export function calcRecoveryPct(bidAmount: number, totalManifestRetailValue: number): number {
  return bidAmount / totalManifestRetailValue;
}

export function calcCommission(winningBid: number): number {
  return 0.05 * winningBid;
}

export function calcNetToSeller(winningBid: number): number {
  return winningBid - calcCommission(winningBid);
}

export function calcVat(winningBid: number, deliveryFee: number): number {
  return 0.05 * (winningBid + deliveryFee);
}

export function calcBuyerTotal(winningBid: number, deliveryFee: number): number {
  return winningBid + deliveryFee + calcVat(winningBid, deliveryFee);
}

export function calcAmountToFund(winningBid: number, deliveryFee: number, deposit: number): number {
  return calcBuyerTotal(winningBid, deliveryFee) - deposit;
}

/** VAT is shown as a separate line, so it is not included here (A1). */
export function calcLandedCostPerUnit(bidAmount: number, deliveryFee: number, totalUnits: number): number {
  return (bidAmount + deliveryFee) / totalUnits;
}

export function calcFinalPayout(netToSeller: number, creditAmount: number): number {
  return netToSeller - creditAmount * (1 - 0.05);
}

/** Delivery fee table (PRD 9.5). "Same emirate" compares the buyer's emirate to the warehouse's. */
export function calcDeliveryFee(pallets: number, sameEmirate: boolean): number {
  const band = pallets <= 4 ? [450, 750] : pallets <= 10 ? [900, 1400] : [1600, 2400];
  return sameEmirate ? band[0] : band[1];
}

// ---- 9.4 Collection outcome and tolerance table ---------------------------

export interface ShortageLine {
  sku: string;
  expectedQty: number;
  receivedQty: number;
  unitRetailValue: number;
}

export function calcShortageValue(lines: ShortageLine[]): number {
  return lines.reduce((sum, l) => {
    const shortfall = l.expectedQty - l.receivedQty;
    return shortfall > 0 ? sum + shortfall * l.unitRetailValue : sum;
  }, 0);
}

export interface GradeShortfallLine {
  sku: string;
  belowGradeUnits: number;
  unitRetailValue: number;
}

/**
 * Below-grade units within the lot's tolerance cost nothing; units over
 * tolerance are valued at 50% of unit retail value and added to the
 * shortage value (assumption, PRD 9.4).
 */
export function calcGradeShortfallValue(
  gradeLines: GradeShortfallLine[],
  totalUnits: number,
  tolerancePct: number,
): number {
  const toleratedUnits = Math.floor(totalUnits * tolerancePct);
  const totalBelowGrade = gradeLines.reduce((s, l) => s + l.belowGradeUnits, 0);
  let remaining = Math.max(0, totalBelowGrade - toleratedUnits);
  if (remaining === 0) return 0;
  let value = 0;
  for (const line of gradeLines) {
    if (remaining <= 0) break;
    const take = Math.min(line.belowGradeUnits, remaining);
    value += take * line.unitRetailValue * 0.5;
    remaining -= take;
  }
  return value;
}

export function calcShortagePct(shortageValue: number, totalManifestRetailValue: number): number {
  return shortageValue / totalManifestRetailValue;
}

export function calcCreditAmount(winningBid: number, shortagePct: number): number {
  return winningBid * shortagePct;
}

export type CollectionOutcome = 'Auto credit' | 'Credit with score impact' | 'Reject available';

export function calcOutcome(shortagePct: number, anyBrokenSeal: boolean): CollectionOutcome {
  if (anyBrokenSeal || shortagePct > 0.1) return 'Reject available';
  if (shortagePct > 0.02) return 'Credit with score impact';
  return 'Auto credit';
}

/**
 * A browse-card estimate for lots with no bid yet: the average recovery % of
 * closed comparables in the same category and grade, applied to this lot's
 * retail value (falls back to 20% with no comparables).
 */
export function estimateLandedCostPerUnit(lot: Lot, comparables: Comparable[]): number {
  const comps = comparablesFor(comparables, lot.category, lot.grade);
  const avgRecovery = comps.length ? comps.reduce((s, c) => s + c.recoveryPct, 0) / comps.length : 0.2;
  const totalRetailValue = lot.manifest.reduce((s, m) => s + m.qty * m.unitRetailValue, 0);
  const totalUnits = lot.manifest.reduce((s, m) => s + m.qty, 0);
  if (totalUnits === 0) return 0;
  const estimatedBid = totalRetailValue * avgRecovery;
  return calcLandedCostPerUnit(estimatedBid, calcDeliveryFee(lot.pallets, true), totalUnits);
}

// ---- Bid ranking and backup bidder (9.3, 8.14) -----------------------------

/** A buyer's proposed destination can conflict with the seller's channel conditions. */
export function findConditionConflict(destination: string, conditions: string[]): string | undefined {
  if (conditions.includes('Export only') && destination.toLowerCase().includes('uae')) {
    return 'Cannot meet "Export only": destination includes UAE';
  }
  return undefined;
}

export function bidNetValue(bid: Bid): number {
  return calcNetToSeller(bid.amount);
}

export function reserveMet(bid: Bid, lot: Lot): boolean {
  return bid.amount >= lot.reserve;
}

export function isBidEligible(bid: Bid, lot: Lot): boolean {
  return reserveMet(bid, lot) && bid.conditionsAccepted && !bid.conditionConflict;
}

export function rankBidsByNetValue(bids: Bid[]): Bid[] {
  return [...bids].sort((a, b) => bidNetValue(b) - bidNetValue(a));
}

/** The next-best eligible bid after the winner (PRD 9.3). */
export function pickBackupBid(bids: Bid[], lot: Lot, winnerBidId: string): Bid | undefined {
  const eligible = bids.filter((b) => b.id !== winnerBidId && isBidEligible(b, lot));
  return rankBidsByNetValue(eligible)[0];
}

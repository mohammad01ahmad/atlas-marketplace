import { describe, it, expect } from 'vitest';
import {
  calcDeposit,
  calcRecoveryPct,
  calcCommission,
  calcNetToSeller,
  calcVat,
  calcBuyerTotal,
  calcAmountToFund,
  calcLandedCostPerUnit,
  calcFinalPayout,
  calcDeliveryFee,
  calcShortageValue,
  calcShortagePct,
  calcCreditAmount,
  calcOutcome,
  calcGradeShortfallValue,
} from './rules';

describe('9.5 money calculations', () => {
  it('deposit is 5% with a 2,000 minimum', () => {
    expect(calcDeposit(205_000)).toBe(10_250);
    expect(calcDeposit(20_000)).toBe(2_000); // 5% of 20,000 is 1,000, floored to the minimum
  });

  it('recovery % is bid over manifest retail value', () => {
    expect(calcRecoveryPct(205_000, 912_400)).toBeCloseTo(0.2247, 4);
  });

  it('commission and net to seller', () => {
    expect(calcCommission(212_000)).toBe(10_600);
    expect(calcNetToSeller(212_000)).toBe(201_400);
  });

  it('VAT, buyer total and amount to fund include delivery and subtract the deposit', () => {
    const winningBid = 212_000;
    const deliveryFee = 1_400; // 6 pallets, other emirate
    const deposit = calcDeposit(winningBid);
    const vat = calcVat(winningBid, deliveryFee);
    expect(vat).toBeCloseTo(0.05 * (winningBid + deliveryFee), 6);
    const total = calcBuyerTotal(winningBid, deliveryFee);
    expect(total).toBeCloseTo(winningBid + deliveryFee + vat, 6);
    expect(calcAmountToFund(winningBid, deliveryFee, deposit)).toBeCloseTo(total - deposit, 6);
  });

  it('landed cost per unit excludes VAT', () => {
    expect(calcLandedCostPerUnit(205_000, 1_400, 4_800)).toBeCloseTo((205_000 + 1_400) / 4_800, 6);
  });

  it('final payout is net to seller minus 95% of the credit', () => {
    const net = calcNetToSeller(212_000);
    const credit = 3_700;
    expect(calcFinalPayout(net, credit)).toBeCloseTo(net - credit * 0.95, 6);
  });

  it('delivery fee table by pallet band and emirate', () => {
    expect(calcDeliveryFee(3, true)).toBe(450);
    expect(calcDeliveryFee(3, false)).toBe(750);
    expect(calcDeliveryFee(6, true)).toBe(900);
    expect(calcDeliveryFee(6, false)).toBe(1_400);
    expect(calcDeliveryFee(12, true)).toBe(1_600);
    expect(calcDeliveryFee(12, false)).toBe(2_400);
  });
});

describe('9.4 collection outcome and tolerance table', () => {
  it('one PB-20K carton short on LOT-1042 gives ~1.7% shortage, auto credit', () => {
    const shortageValue = calcShortageValue([
      { sku: 'PB-20K', expectedQty: 1_400, receivedQty: 1_320, unitRetailValue: 199 },
    ]);
    expect(shortageValue).toBe(15_920); // 80 units x AED 199, per the demo script (PRD 11.7)
    const shortagePct = calcShortagePct(shortageValue, 912_400);
    expect(shortagePct).toBeCloseTo(0.017452, 5);
    expect(calcOutcome(shortagePct, false)).toBe('Auto credit');
  });

  it('a 3.1% shortage lands in credit-with-score-impact (LOT-1029 history)', () => {
    expect(calcOutcome(0.031, false)).toBe('Credit with score impact');
  });

  it('over 10% shortage, or any broken seal, makes reject available', () => {
    expect(calcOutcome(0.11, false)).toBe('Reject available');
    expect(calcOutcome(0.005, true)).toBe('Reject available');
  });

  it('credit amount is winning bid times shortage percent', () => {
    expect(calcCreditAmount(212_000, 0.017452)).toBeCloseTo(3_699.8, 1);
  });

  it('grade shortfall only counts units over the lot tolerance, at 50% value', () => {
    // 4,800 units, 10% tolerance -> 480 units tolerated free.
    const value = calcGradeShortfallValue(
      [{ sku: 'EB-210', belowGradeUnits: 500, unitRetailValue: 249 }],
      4_800,
      0.1,
    );
    // 20 units over tolerance, at 50% of 249.
    expect(value).toBe(20 * 249 * 0.5);
  });

  it('grade shortfall within tolerance costs nothing', () => {
    const value = calcGradeShortfallValue(
      [{ sku: 'EB-210', belowGradeUnits: 400, unitRetailValue: 249 }],
      4_800,
      0.1,
    );
    expect(value).toBe(0);
  });
});

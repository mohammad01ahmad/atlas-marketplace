'use client';

import { useState } from 'react';
import type { Lot } from '@/types';
import { calcDeliveryFee, calcLandedCostPerUnit, calcVat, calcRecoveryPct } from '@/lib/rules';
import { aed, pct } from '@/lib/format';
import { MoneyRow } from '@/components/ui/MoneyRow';

/** Buyer enters a bid amount and chooses collection or delivery; updates live (PRD 8.4.7). */
export function LandedCost({ lot, buyerEmirate, totalUnits, totalRetailValue }: { lot: Lot; buyerEmirate: string; totalUnits: number; totalRetailValue: number }) {
  const [amount, setAmount] = useState(Math.round(totalRetailValue * 0.2));
  const [delivery, setDelivery] = useState<'Collection' | 'Delivery'>('Collection');

  const fee = delivery === 'Delivery' ? calcDeliveryFee(lot.pallets, buyerEmirate === lot.warehouse.emirate) : 0;
  const perUnit = totalUnits > 0 ? calcLandedCostPerUnit(amount, fee, totalUnits) : 0;
  const vat = calcVat(amount, fee);
  const total = amount + fee + vat;
  const recovery = totalRetailValue > 0 ? calcRecoveryPct(amount, totalRetailValue) : 0;

  return (
    <div className="space-y-3 rounded-[10px] border border-line bg-paper p-4" data-tour="landed-cost">
      <div>
        <label htmlFor="landed-cost-amount" className="mb-1 block text-xs font-medium text-ink-muted">
          Your bid amount (AED)
        </label>
        <input
          id="landed-cost-amount"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
        />
      </div>

      <div className="flex gap-1 rounded-md border border-line bg-surface p-0.5 text-sm">
        {(['Collection', 'Delivery'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setDelivery(opt)}
            className={`flex-1 rounded px-3 py-1.5 font-medium ${delivery === opt ? 'bg-primary-soft text-primary' : 'text-ink-muted'}`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="border-t border-line pt-2">
        <MoneyRow label="Landed cost per unit" amount={perUnit} strong />
        <p className="mb-1 text-xs text-ink-muted">{pct(recovery, 1)} of retail value</p>
        <MoneyRow label="Bid amount" amount={amount} muted />
        {delivery === 'Delivery' && <MoneyRow label="Delivery fee" amount={fee} muted />}
        <MoneyRow label="VAT (5%)" amount={vat} muted />
        <MoneyRow label="Total" amount={total} strong />
      </div>
    </div>
  );
}

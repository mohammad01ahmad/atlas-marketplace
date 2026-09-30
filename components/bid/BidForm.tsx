'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtlasStore } from '@/lib/store';
import { calcDeposit, calcRecoveryPct, calcLandedCostPerUnit } from '@/lib/rules';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Button } from '@/components/ui/Button';
import { MoneyRow } from '@/components/ui/MoneyRow';
import { aed, pct, formatDate } from '@/lib/format';
import { toast } from '@/lib/toast';

const STEP_LABELS = ['Price', 'Terms', 'Review'];
const DESTINATIONS = ['Kenya', 'Tanzania', 'Uganda', 'Pakistan', 'Uzbekistan', 'Kazakhstan', 'Egypt', 'Sudan', 'UAE', 'Oman'];

/** Three-step Place bid form (PRD 8.6). */
export function BidForm({ lotId }: { lotId: string }) {
  const router = useRouter();
  const lot = useAtlasStore((s) => s.lots.find((l) => l.id === lotId));
  const buyer = useAtlasStore((s) => s.companies.find((c) => c.id === s.activeBuyerId));
  const placeBid = useAtlasStore((s) => s.placeBid);

  const totalRetailValue = lot?.manifest.reduce((s, m) => s + m.qty * m.unitRetailValue, 0) ?? 0;
  const totalUnits = lot?.manifest.reduce((s, m) => s + m.qty, 0) ?? 0;

  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(Math.round(totalRetailValue * 0.2) || 1000);
  const [collectionDate, setCollectionDate] = useState(lot?.collectionWindow.from ?? new Date().toISOString());
  const [destination, setDestination] = useState(buyer?.marketsServed?.[0] ?? DESTINATIONS[0]);
  const [conditionsAccepted, setConditionsAccepted] = useState(!lot || lot.conditions.length === 0);
  const [note, setNote] = useState('');

  if (!lot) return null;

  const deposit = calcDeposit(amount);
  const recovery = totalRetailValue > 0 ? calcRecoveryPct(amount, totalRetailValue) : 0;
  const perUnit = totalUnits > 0 ? calcLandedCostPerUnit(amount, 0, totalUnits) : 0;

  function submit() {
    const res = placeBid(lotId, { amount, collectionDate, destination, conditionsAccepted, note: note || undefined });
    if (res.ok) {
      toast('Bid placed.');
      router.push('/buyer/bids');
    } else {
      toast(res.error ?? 'Could not place bid.');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <StepIndicator step={step} total={3} label={STEP_LABELS[step - 1]} />

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label htmlFor="bid-amount" className="mb-1 block text-xs font-medium text-ink-muted">
              Bid amount (AED)
            </label>
            <input
              id="bid-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
            />
          </div>
          <div className="space-y-1 rounded-md border border-line bg-paper p-3">
            <Row label="Recovery % of retail" value={pct(recovery, 1)} />
            <Row label="Cost per unit" value={aed(perUnit)} />
            <Row label="Deposit to be held" value={aed(deposit)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div>
            <label htmlFor="collection-date" className="mb-1 block text-xs font-medium text-ink-muted">
              Proposed collection date
            </label>
            <input
              id="collection-date"
              type="date"
              value={collectionDate.slice(0, 10)}
              min={lot.collectionWindow.from.slice(0, 10)}
              max={lot.collectionWindow.to.slice(0, 10)}
              onChange={(e) => setCollectionDate(new Date(e.target.value).toISOString())}
              className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-primary"
            />
          </div>
          <div>
            <label htmlFor="destination" className="mb-1 block text-xs font-medium text-ink-muted">
              Destination market
            </label>
            <select id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink">
              {DESTINATIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          {lot.conditions.length > 0 && (
            <label className="flex items-start gap-2 text-sm text-ink">
              <input type="checkbox" className="mt-0.5" checked={conditionsAccepted} onChange={(e) => setConditionsAccepted(e.target.checked)} />
              I accept the seller&apos;s channel conditions: {lot.conditions.join('; ')}
            </label>
          )}
          <div>
            <label htmlFor="bid-note" className="mb-1 block text-xs font-medium text-ink-muted">
              Note to seller (optional, max 280 characters)
            </label>
            <textarea
              id="bid-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 280))}
              rows={3}
              className="w-full rounded-md border border-line bg-surface p-3 text-sm text-ink outline-none focus-visible:border-primary"
            />
            <p className="mt-1 text-right text-xs text-ink-muted">{note.length}/280</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 rounded-[10px] border border-line bg-paper p-4">
          <MoneyRow label="Bid amount" amount={amount} strong />
          <p className="text-sm text-ink-muted">
            {formatDate(collectionDate)} · {destination}
          </p>
          <p className="text-sm text-ink">{aed(deposit)} will be held and released if you do not win.</p>
          <p className="text-sm text-ink-muted">Other bidders cannot see your bid. You can raise it until bidding closes.</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < 3 ? (
          <Button disabled={step === 2 && lot.conditions.length > 0 && !conditionsAccepted} onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button onClick={submit}>Place bid</Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

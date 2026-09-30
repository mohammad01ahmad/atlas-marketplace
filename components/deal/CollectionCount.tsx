'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Button } from '@/components/ui/Button';
import { SealTag } from '@/components/ui/SealTag';
import { MoneyRow } from '@/components/ui/MoneyRow';
import { StateBadge } from '@/components/ui/StateBadge';
import { pct } from '@/lib/format';
import { calcShortageValue, calcGradeShortfallValue, calcShortagePct, calcCreditAmount, calcOutcome } from '@/lib/rules';

const STEP_LABELS = ['Check seals', 'Count by line', 'Grade check', 'Summary', 'Confirm and submit'];

/** Guided, mobile-first collection count flow (PRD 8.9). */
export function CollectionCount({ dealId }: { dealId: string }) {
  const router = useRouter();
  const deal = useAtlasStore((s) => s.deals.find((d) => d.id === dealId));
  const lot = useAtlasStore((s) => s.lots.find((l) => l.id === deal?.lotId));
  const bid = useAtlasStore((s) => s.bids.find((b) => b.id === deal?.bidId));
  const forcedShortageDealId = useAtlasStore((s) => s.forcedShortageDealId);
  const submitCollectionCount = useAtlasStore((s) => s.submitCollectionCount);

  const forcedSku = forcedShortageDealId === dealId ? (lot?.manifest.find((m) => m.sku === 'PB-20K')?.sku ?? lot?.manifest[0]?.sku) : undefined;

  const [step, setStep] = useState(1);
  const [seals, setSeals] = useState<Record<string, boolean>>(() => Object.fromEntries((lot?.cartons ?? []).map((c) => [c.sealId, true])));
  const [received, setReceived] = useState<Record<string, number>>(() =>
    Object.fromEntries((lot?.manifest ?? []).map((m) => [m.sku, forcedSku === m.sku ? Math.max(0, m.qty - 80) : m.qty])),
  );
  const [belowGrade, setBelowGrade] = useState<Record<string, number>>(() => Object.fromEntries((lot?.manifest ?? []).map((m) => [m.sku, 0])));

  if (!deal || !lot || !bid) return null;

  const totalManifestValue = lot.manifest.reduce((s, m) => s + m.qty * m.unitRetailValue, 0);
  const totalUnits = lot.manifest.reduce((s, m) => s + m.qty, 0);
  const anyBroken = Object.values(seals).some((v) => !v);

  const shortageValue = calcShortageValue(
    lot.manifest.map((m) => ({ sku: m.sku, expectedQty: m.qty, receivedQty: received[m.sku] ?? m.qty, unitRetailValue: m.unitRetailValue })),
  );
  const gradeValue = calcGradeShortfallValue(
    lot.manifest.filter((m) => (belowGrade[m.sku] ?? 0) > 0).map((m) => ({ sku: m.sku, belowGradeUnits: belowGrade[m.sku] ?? 0, unitRetailValue: m.unitRetailValue })),
    totalUnits,
    lot.gradeTolerancePct,
  );
  const totalShortageValue = shortageValue + gradeValue;
  const shortagePct = calcShortagePct(totalShortageValue, totalManifestValue);
  const outcome = calcOutcome(shortagePct, anyBroken);
  const creditAmount = calcCreditAmount(bid.amount, shortagePct);

  function handleSubmit() {
    submitCollectionCount(dealId, {
      seals: lot!.cartons.map((c) => ({ sealId: c.sealId, intact: seals[c.sealId] ?? true })),
      lines: lot!.manifest.map((m) => ({ sku: m.sku, received: received[m.sku] ?? m.qty, belowGrade: belowGrade[m.sku] ?? 0 })),
    });
    router.push(`/buyer/deals/${dealId}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <StepIndicator step={step} total={5} label={STEP_LABELS[step - 1]} />

      {step === 1 && (
        <div data-tour="collection-count" className="space-y-2">
          <p className="text-sm text-ink-muted">Mark each carton seal as intact or broken.</p>
          {lot.cartons.map((c) => (
            <div key={c.sealId} className="flex items-center justify-between rounded-md border border-line p-2.5">
              <SealTag sealId={c.sealId} intact={seals[c.sealId]} />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSeals((s) => ({ ...s, [c.sealId]: true }))}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${seals[c.sealId] ? 'bg-primary-soft text-primary' : 'text-ink-muted'}`}
                >
                  Intact
                </button>
                <button
                  type="button"
                  onClick={() => setSeals((s) => ({ ...s, [c.sealId]: false }))}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${seals[c.sealId] === false ? 'bg-danger-soft text-danger' : 'text-ink-muted'}`}
                >
                  Broken
                </button>
              </div>
            </div>
          ))}
          {anyBroken && (
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <Camera size={13} /> A photo is attached for each broken seal (mock).
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <p className="text-sm text-ink-muted">Enter units received for each line. Defaults to the manifest quantity.</p>
          {lot.manifest.map((m) => {
            const short = (received[m.sku] ?? m.qty) < m.qty;
            return (
              <div key={m.sku} className={`rounded-md border p-2.5 ${short ? 'border-danger bg-danger-soft/40' : 'border-line'}`}>
                <div className="flex items-center justify-between text-sm">
                  <span>{m.product}</span>
                  <span className="text-xs text-ink-muted">Expected {m.qty.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={received[m.sku] ?? m.qty}
                  onChange={(e) => setReceived((r) => ({ ...r, [m.sku]: Number(e.target.value) || 0 }))}
                  className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
                />
              </div>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <p className="text-sm text-ink-muted">Optional: mark units that fall below the stated grade for each line.</p>
          {lot.manifest.map((m) => (
            <div key={m.sku} className="rounded-md border border-line p-2.5">
              <div className="flex items-center justify-between text-sm">
                <span>{m.product}</span>
                <span className="text-xs text-ink-muted">of {(received[m.sku] ?? m.qty).toLocaleString()} received</span>
              </div>
              <input
                type="number"
                min={0}
                max={received[m.sku] ?? m.qty}
                value={belowGrade[m.sku] ?? 0}
                onChange={(e) => setBelowGrade((b) => ({ ...b, [m.sku]: Number(e.target.value) || 0 }))}
                className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
              />
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-1 rounded-[10px] border border-line bg-paper p-4">
          <MoneyRow label="Expected value" amount={totalManifestValue} muted />
          <MoneyRow label="Received value" amount={totalManifestValue - totalShortageValue} muted />
          <div className="flex items-baseline justify-between py-1.5 text-sm">
            <span>Shortage by value</span>
            <span className="tabular-nums font-medium">{pct(shortagePct, 2)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span>Outcome</span>
            <StateBadge state={outcome} />
          </div>
          <MoneyRow label="Price adjustment (credit)" amount={creditAmount} strong />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-2 rounded-[10px] border border-line bg-paper p-4 text-sm text-ink-muted">
          <p>Seller representative confirmed count.</p>
          <p>
            Submitting will {outcome === 'Reject available' ? 'let you accept with credit or reject the lot' : 'move this deal into the inspection window'}.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
        ) : (
          <Button onClick={handleSubmit}>Confirm and submit</Button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtlasStore } from '@/lib/store';
import { comparablesFor } from '@/data/comparables';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SealTag } from '@/components/ui/SealTag';
import { RecoveryChart } from '@/components/lot/RecoveryChart';
import { ManifestTable } from '@/components/lot/ManifestTable';
import { toast } from '@/lib/toast';
import { aed } from '@/lib/format';
import type { Category, Emirate, Grade, Lot, ManifestLine } from '@/types';

const CATEGORIES: Category[] = ['Electronics', 'Cosmetics', 'Apparel', 'Household'];
const GRADES: Grade[] = ['New sealed', 'New open box', 'Returns tested', 'Returns untested', 'Salvage'];
const EMIRATES: Emirate[] = ['Dubai', 'Sharjah', 'Ajman'];
const CHANNEL_CONDITIONS = [
  'Export only',
  'No resale on Amazon, Noon or other online marketplaces in the UAE',
  'No resale to UAE retail stores',
  'Destination limited to selected markets',
  'Remove brand labels before resale (apparel only)',
];
const STEP_LABELS = ['Basics', 'Manifest', 'Grade and evidence', 'Provenance', 'Seal cartons', 'Terms and price', 'Review and publish'];

function parseCsv(text: string): { lines: ManifestLine[]; errors: string[] } {
  const rows = text.trim().split('\n').slice(1); // skip header
  const lines: ManifestLine[] = [];
  const errors: string[] = [];
  for (const row of rows) {
    const [sku, product, qty, unitRetailValue, expiry, grade] = row.split(',').map((c) => c.trim());
    if (!sku) continue;
    if (!qty || !unitRetailValue) {
      errors.push(`${sku || 'Row'}: missing quantity or retail value`);
      continue;
    }
    lines.push({ sku, product, qty: Number(qty), unitRetailValue: Number(unitRetailValue), expiry: expiry || undefined, grade: (grade as Grade) || 'New sealed' });
  }
  return { lines, errors };
}

export default function CreateListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSellerId = useAtlasStore((s) => s.activeSellerId);
  const companies = useAtlasStore((s) => s.companies);
  const comparables = useAtlasStore((s) => s.comparables);
  const saveDraftLot = useAtlasStore((s) => s.saveDraftLot);
  const submitListing = useAtlasStore((s) => s.submitListing);

  const [step, setStep] = useState(1);
  useEffect(() => {
    const stepParam = Number(searchParams.get('step'));
    if (stepParam >= 1 && stepParam <= 7) setStep(stepParam);
  }, [searchParams]);

  const [lotId] = useState(() => `LOT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Electronics');
  const [emirate, setEmirate] = useState<Emirate>('Dubai');
  const [area, setArea] = useState('');
  const [collectionDays, setCollectionDays] = useState(7);
  const [showSellerName, setShowSellerName] = useState(true);

  const [manifest, setManifest] = useState<ManifestLine[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [manualLine, setManualLine] = useState<Partial<ManifestLine>>({ grade: 'New sealed' });

  const [grade, setGrade] = useState<Grade>('New sealed');
  const [tolerancePct, setTolerancePct] = useState(0.1);
  const [sampleSkus, setSampleSkus] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const [provenanceType, setProvenanceType] = useState<'Commercial invoice' | 'Bill of entry'>('Commercial invoice');
  const [provenanceVerified, setProvenanceVerified] = useState(false);

  const [cartonCount, setCartonCount] = useState(10);
  const [seals, setSeals] = useState<{ sealId: string; lines: string[] }[]>([]);
  const [sealsConfirmed, setSealsConfirmed] = useState(false);

  const [biddingDuration, setBiddingDuration] = useState<3 | 5 | 7>(5);
  const [reserve, setReserve] = useState(0);
  const [buyNow, setBuyNow] = useState<number | ''>('');
  const [splitInto, setSplitInto] = useState<number | ''>('');
  const [perBuyerCap, setPerBuyerCap] = useState<number | ''>('');
  const [conditions, setConditions] = useState<string[]>([]);

  const totalUnits = manifest.reduce((s, m) => s + m.qty, 0);
  const totalRetailValue = manifest.reduce((s, m) => s + m.qty * m.unitRetailValue, 0);
  const activeBuyersInCategory = companies.filter((c) => c.role === 'buyer' && c.categories.includes(category)).length;
  const comps = comparablesFor(comparables, category, grade);

  function buildLot(state: Lot['state']): Lot {
    const now = new Date().toISOString();
    return {
      id: lotId,
      sellerId: activeSellerId,
      title: title || 'Untitled lot',
      category,
      grade,
      gradeTolerancePct: tolerancePct,
      warehouse: { emirate, area: area || emirate },
      showSellerName,
      manifest,
      cartons: seals,
      pallets: Math.max(1, Math.ceil(cartonCount / 10)),
      provenanceDoc: { type: provenanceType, verified: provenanceVerified },
      sampleEvidence: sampleSkus.map((sku) => ({ sku, photos: ['placeholder-1.svg'], testResult: testResults[sku] })),
      reserve: Number(reserve) || 0,
      buyNow: buyNow === '' ? undefined : Number(buyNow),
      splitInto: splitInto === '' ? undefined : Number(splitInto),
      perBuyerCap: perBuyerCap === '' ? undefined : Number(perBuyerCap),
      conditions,
      collectionWindow: { from: now, to: new Date(Date.now() + 24 * 3600_000 * 14).toISOString() },
      state,
      opensAt: now,
      closesAt: new Date(Date.now() + biddingDuration * 24 * 3600_000).toISOString(),
      questions: [],
    };
  }

  function handleCsvUpload(file: File) {
    file.text().then((text) => {
      const { lines, errors } = parseCsv(text);
      setManifest((m) => [...m, ...lines]);
      setCsvErrors(errors);
      toast(`Imported ${lines.length} manifest line${lines.length === 1 ? '' : 's'}.`);
    });
  }

  function addManualLine() {
    if (!manualLine.sku || !manualLine.qty || !manualLine.unitRetailValue) {
      toast('SKU, quantity and unit retail value are required.');
      return;
    }
    setManifest((m) => [...m, { sku: manualLine.sku!, product: manualLine.product ?? manualLine.sku!, qty: Number(manualLine.qty), unitRetailValue: Number(manualLine.unitRetailValue), grade: manualLine.grade ?? 'New sealed' }]);
    setManualLine({ grade: 'New sealed' });
  }

  function generateSeals() {
    const base = 4000 + Math.floor(Math.random() * 900) * 10;
    const skus = manifest.map((m) => m.sku);
    const generated = Array.from({ length: cartonCount }, (_, i) => ({ sealId: `S-${base + i}`, lines: skus.length ? [skus[i % skus.length]] : [] }));
    setSeals(generated);
  }

  function pickSamples() {
    const shuffled = [...manifest].sort(() => Math.random() - 0.5);
    setSampleSkus(shuffled.slice(0, Math.min(3, shuffled.length)).map((l) => l.sku));
  }

  function saveDraft() {
    saveDraftLot(buildLot('Draft'));
    toast('Draft saved.');
    router.push('/seller/lots');
  }

  function publish() {
    submitListing(buildLot('Under review'));
    toast('Submitted for review.');
    router.push('/seller/lots');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold text-ink">Create listing</h1>
      <StepIndicator step={step} total={7} label={STEP_LABELS[step - 1]} />

      {step === 1 && (
        <div className="space-y-3">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Warehouse emirate">
              <select value={emirate} onChange={(e) => setEmirate(e.target.value as Emirate)} className={inputClass}>
                {EMIRATES.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </Field>
            <Field label="Warehouse area">
              <input value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Collection availability (days after close)">
            <input type="number" min={1} value={collectionDays} onChange={(e) => setCollectionDays(Number(e.target.value) || 1)} className={inputClass} />
          </Field>
          <Field label="Seller visibility">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={showSellerName} onChange={(e) => setShowSellerName(e.target.checked)} />
              Show company name (otherwise shown as &quot;Verified distributor, {area || emirate}&quot;)
            </label>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label
              htmlFor="csv-upload"
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-primary-soft"
            >
              Upload CSV
            </label>
            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])} />
            <a href="/sample-manifest.csv" download className="text-xs text-ink-muted underline">
              Download sample manifest
            </a>
          </div>
          {csvErrors.length > 0 && (
            <ul className="rounded-md border border-danger bg-danger-soft p-2 text-xs text-danger">
              {csvErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-5 gap-2">
            <input placeholder="SKU" value={manualLine.sku ?? ''} onChange={(e) => setManualLine((l) => ({ ...l, sku: e.target.value }))} className={inputClass} />
            <input placeholder="Product" value={manualLine.product ?? ''} onChange={(e) => setManualLine((l) => ({ ...l, product: e.target.value }))} className={inputClass} />
            <input type="number" placeholder="Qty" value={manualLine.qty ?? ''} onChange={(e) => setManualLine((l) => ({ ...l, qty: Number(e.target.value) }))} className={inputClass} />
            <input type="number" placeholder="Unit retail" value={manualLine.unitRetailValue ?? ''} onChange={(e) => setManualLine((l) => ({ ...l, unitRetailValue: Number(e.target.value) }))} className={inputClass} />
            <Button size="sm" variant="secondary" onClick={addManualLine}>
              Add line
            </Button>
          </div>
          {manifest.length > 0 && <ManifestTable lines={manifest} />}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <Field label="Grade">
            <select value={grade} onChange={(e) => setGrade(e.target.value as Grade)} className={inputClass}>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Grade tolerance">
            <input type="number" min={0} max={0.5} step={0.01} value={tolerancePct} onChange={(e) => setTolerancePct(Number(e.target.value) || 0)} className={inputClass} />
          </Field>
          <Button size="sm" variant="secondary" onClick={pickSamples} disabled={manifest.length === 0}>
            Select samples (Atlas picks at random)
          </Button>
          {sampleSkus.map((sku) => (
            <div key={sku} className="rounded-md border border-line bg-paper p-3">
              <p className="text-sm font-medium text-ink">{sku}</p>
              <p className="text-xs text-ink-muted">Photos uploaded (mock)</p>
              {grade.startsWith('Returns') && (
                <input
                  placeholder="Test result"
                  value={testResults[sku] ?? ''}
                  onChange={(e) => setTestResults((t) => ({ ...t, [sku]: e.target.value }))}
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <Field label="Document type">
            <select value={provenanceType} onChange={(e) => setProvenanceType(e.target.value as typeof provenanceType)} className={inputClass}>
              <option>Commercial invoice</option>
              <option>Bill of entry</option>
            </select>
          </Field>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setTimeout(() => setProvenanceVerified(true), 800);
              toast('Document uploaded, verifying…');
            }}
          >
            Upload document (mock)
          </Button>
          {provenanceVerified && <Badge tone="primary">Verified</Badge>}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <Field label="Carton count">
            <input type="number" min={1} value={cartonCount} onChange={(e) => setCartonCount(Number(e.target.value) || 1)} className={inputClass} />
          </Field>
          <Button size="sm" variant="secondary" onClick={generateSeals} disabled={manifest.length === 0}>
            Generate seal IDs
          </Button>
          {seals.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {seals.slice(0, 24).map((c) => (
                  <SealTag key={c.sealId} sealId={c.sealId} />
                ))}
                {seals.length > 24 && <span className="self-center text-xs text-ink-muted">+{seals.length - 24} more</span>}
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={sealsConfirmed} onChange={(e) => setSealsConfirmed(e.target.checked)} />
                Cartons sealed and photographed
              </label>
            </>
          )}
        </div>
      )}

      {step === 6 && (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">Auction type: Sealed bid. Private auction is shown as coming later.</p>
          <Field label="Bidding duration">
            <select value={biddingDuration} onChange={(e) => setBiddingDuration(Number(e.target.value) as 3 | 5 | 7)} className={inputClass}>
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
            </select>
          </Field>
          <div data-tour="terms-step" className="space-y-3">
            <Field label="Hidden reserve price (AED)">
              <input type="number" value={reserve} onChange={(e) => setReserve(Number(e.target.value) || 0)} className={inputClass} />
            </Field>
            <Field label="Buy now price (AED, optional)">
              <input type="number" value={buyNow} onChange={(e) => setBuyNow(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Split into (lots, optional)">
                <input type="number" min={1} value={splitInto} onChange={(e) => setSplitInto(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />
              </Field>
              <Field label="Per-buyer cap (units, optional)">
                <input type="number" value={perBuyerCap} onChange={(e) => setPerBuyerCap(e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />
              </Field>
            </div>
            <Field label="Channel conditions">
              <div className="space-y-1.5">
                {CHANNEL_CONDITIONS.map((c) => (
                  <label key={c} className="flex items-start gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={conditions.includes(c)}
                      onChange={(e) => setConditions((prev) => (e.target.checked ? [...prev, c] : prev.filter((x) => x !== c)))}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </Field>
          </div>
          <div className="rounded-md border border-line bg-paper p-3">
            <p className="mb-1 text-xs font-medium text-ink-muted" data-tour="active-buyers">
              {activeBuyersInCategory} verified buyers active in {category}
            </p>
            <RecoveryChart comparables={comps} />
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-3 rounded-[10px] border border-line bg-paper p-4">
          <p className="text-sm text-ink">
            {title || 'Untitled lot'} — {totalUnits.toLocaleString()} units, {aed(totalRetailValue)} retail value, {seals.length} cartons.
          </p>
          <p className="text-sm text-ink-muted">Stock is locked once bidding opens. Withdrawing after that carries a penalty.</p>
        </div>
      )}

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          <Button variant="ghost" onClick={saveDraft}>
            Save as draft
          </Button>
        </div>
        {step < 7 ? <Button onClick={() => setStep((s) => s + 1)}>Next</Button> : <Button onClick={publish}>Submit for review</Button>}
      </div>
    </div>
  );
}

const inputClass = 'h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  );
}

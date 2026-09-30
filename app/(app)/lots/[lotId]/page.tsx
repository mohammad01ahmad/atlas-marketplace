'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { FileCheck, Plus, Check } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { comparablesFor } from '@/data/comparables';
import { ManifestTable } from '@/components/lot/ManifestTable';
import { GradeEvidence } from '@/components/lot/GradeEvidence';
import { RecoveryChart } from '@/components/lot/RecoveryChart';
import { LandedCost } from '@/components/lot/LandedCost';
import { SealTag } from '@/components/ui/SealTag';
import { Badge } from '@/components/ui/Badge';
import { StateBadge } from '@/components/ui/StateBadge';
import { Countdown } from '@/components/ui/Countdown';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Dialog } from '@/components/ui/Dialog';
import { aed, formatDate } from '@/lib/format';
import { toast } from '@/lib/toast';

export default function LotDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = use(params);
  const role = useAtlasStore((s) => s.role);
  const activeSellerId = useAtlasStore((s) => s.activeSellerId);
  const activeBuyerId = useAtlasStore((s) => s.activeBuyerId);
  const lot = useAtlasStore((s) => s.lots.find((l) => l.id === lotId));
  const companies = useAtlasStore((s) => s.companies);
  const comparables = useAtlasStore((s) => s.comparables);
  const compareIds = useAtlasStore((s) => s.compareIds);
  const addToCompare = useAtlasStore((s) => s.addToCompare);
  const removeFromCompare = useAtlasStore((s) => s.removeFromCompare);
  const askQuestion = useAtlasStore((s) => s.askQuestion);
  const answerQuestion = useAtlasStore((s) => s.answerQuestion);
  const buyNow = useAtlasStore((s) => s.buyNow);

  const [question, setQuestion] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [inspectionOpen, setInspectionOpen] = useState(false);

  if (!lot) return <p className="text-sm text-ink-muted">Lot not found.</p>;

  const seller = companies.find((c) => c.id === lot.sellerId);
  const buyer = companies.find((c) => c.id === activeBuyerId);
  const totalUnits = lot.manifest.reduce((s, m) => s + m.qty, 0);
  const totalRetailValue = lot.manifest.reduce((s, m) => s + m.qty * m.unitRetailValue, 0);
  const revealSellerName = lot.showSellerName || ['Awarded', 'In deal', 'Completed'].includes(lot.state);
  const comps = comparablesFor(comparables, lot.category, lot.grade);
  const inCompare = compareIds.includes(lot.id);
  const canBid = (buyer?.depositBalance ?? 0) >= 2000;
  const isOwner = role === 'seller' && lot.sellerId === activeSellerId;

  return (
    <div className="max-w-3xl space-y-8">
      {/* 1. Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StateBadge state={lot.state} />
          {lot.state === 'Live' && <Countdown target={lot.closesAt} prefix="Closes in" />}
        </div>
        <h1 className="mt-2 text-xl font-semibold text-ink">{lot.title}</h1>
        <Link href={`/sellers/${seller?.id}`} className="mt-1 inline-flex flex-wrap items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <span>{revealSellerName ? seller?.name : `Verified distributor, ${lot.warehouse.area}`}</span>
          <Badge tone="primary">{Math.round((seller?.manifestAccuracy ?? 0) * 100)}% manifest accuracy</Badge>
          <Badge>{seller?.lotsSold ?? 0} lots sold</Badge>
          <Badge tone={((seller?.disputeRate ?? 0) <= 0.05) ? 'primary' : 'warning'}>{Math.round((seller?.disputeRate ?? 0) * 100)}% dispute rate</Badge>
        </Link>
      </div>

      {/* 2. Summary */}
      <dl className="grid grid-cols-2 gap-4 rounded-[10px] border border-line bg-surface p-4 sm:grid-cols-4">
        <Stat label="Units" value={totalUnits.toLocaleString()} />
        <Stat label="Cartons" value={lot.cartons.length.toLocaleString()} />
        <Stat label="Retail value" value={aed(totalRetailValue)} />
        <Stat label="Grade" value={lot.grade} />
        <Stat label="Location" value={`${lot.warehouse.area}, ${lot.warehouse.emirate}`} />
        <Stat label="Collection availability" value={`${formatDate(lot.collectionWindow.from)} to ${formatDate(lot.collectionWindow.to)}`} />
      </dl>

      {/* 3. Manifest */}
      <Section title="Manifest">
        <ManifestTable lines={lot.manifest} />
      </Section>

      {/* 4. Grade evidence */}
      <Section title="Grade and evidence">
        <GradeEvidence grade={lot.grade} tolerancePct={lot.gradeTolerancePct} sampleEvidence={lot.sampleEvidence} />
      </Section>

      {/* 5. Provenance */}
      <Section title="Provenance">
        <Badge tone={lot.provenanceDoc.verified ? 'primary' : 'neutral'} icon={FileCheck}>
          {lot.provenanceDoc.type} {lot.provenanceDoc.verified ? 'verified' : 'pending'}
        </Badge>
      </Section>

      {/* 6. Seals */}
      <Section title="Seals">
        <div className="flex flex-wrap gap-1.5">
          {lot.cartons.map((c) => (
            <SealTag key={c.sealId} sealId={c.sealId} />
          ))}
        </div>
      </Section>

      {/* 7. Valuation panel */}
      <Section title="Valuation">
        <div className="space-y-4">
          <RecoveryChart comparables={comps} />
          <LandedCost lot={lot} buyerEmirate={buyer?.emirate ?? lot.warehouse.emirate} totalUnits={totalUnits} totalRetailValue={totalRetailValue} />
        </div>
      </Section>

      {/* 8. Terms */}
      <Section title="Terms">
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-ink-muted">Channel conditions: </span>
            {lot.conditions.length ? lot.conditions.join('; ') : 'None'}
          </p>
          {lot.perBuyerCap && (
            <p className="flex items-center gap-1 text-ink-muted">
              Per-buyer cap: {lot.perBuyerCap.toLocaleString()} units <Tooltip text="The maximum units a single buyer may win from this lot." />
            </p>
          )}
          <p className="text-ink-muted">
            Collection window: {formatDate(lot.collectionWindow.from)} to {formatDate(lot.collectionWindow.to)}
          </p>
        </div>
      </Section>

      {/* 9. Q&A */}
      <Section title="Questions and answers">
        <div className="space-y-3">
          {lot.questions.length === 0 && <p className="text-sm text-ink-muted">No questions yet.</p>}
          {lot.questions.map((q) => (
            <div key={q.id} className="rounded-md border border-line bg-surface p-3 text-sm">
              <p className="text-ink">{q.q}</p>
              {q.a ? (
                <p className="mt-1.5 border-t border-line pt-1.5 text-ink-muted">{q.a}</p>
              ) : isOwner ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={answerDrafts[q.id] ?? ''}
                    onChange={(e) => setAnswerDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                    placeholder="Write an answer"
                    className="h-9 flex-1 rounded-md border border-line bg-paper px-2.5 text-sm text-ink outline-none focus-visible:border-primary"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      answerQuestion(lot.id, q.id, answerDrafts[q.id] ?? '');
                      toast('Answer posted.');
                    }}
                  >
                    Post
                  </Button>
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-ink-muted">Awaiting an answer.</p>
              )}
            </div>
          ))}
          {role === 'buyer' && (
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question"
                className="h-9 flex-1 rounded-md border border-line bg-surface px-2.5 text-sm text-ink outline-none focus-visible:border-primary"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!question.trim()}
                onClick={() => {
                  askQuestion(lot.id, question.trim());
                  setQuestion('');
                  toast('Question posted.');
                }}
              >
                Ask
              </Button>
            </div>
          )}
        </div>
      </Section>

      {/* 10. Inspection */}
      <Section title="Inspection">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setInspectionOpen(true)}>
            Request inspection
          </Button>
          {lot.inspectionReport && (
            <Badge tone="info" icon={FileCheck}>
              Inspection report, {formatDate(lot.inspectionReport.date)}
            </Badge>
          )}
        </div>
      </Section>

      {/* Actions */}
      {role === 'buyer' && lot.state === 'Live' && (
        <div className="sticky bottom-4 flex flex-wrap items-center gap-2 rounded-[10px] border border-line bg-surface p-3 shadow-lg">
          <div data-tour="place-bid-button">
            <Link href={canBid ? `/lots/${lot.id}/bid` : '#'}>
              <Button disabled={!canBid}>Place bid</Button>
            </Link>
          </div>
          {!canBid && <p className="text-xs text-danger">Deposit could not be held. Add a payment method to place bids.</p>}
          {lot.buyNow && (
            <Button
              variant="secondary"
              disabled={!canBid}
              onClick={() => {
                const res = buyNow(lot.id);
                if (res.ok) toast(`Bought ${lot.id} now.`);
                else toast(res.error ?? 'Could not buy now.');
              }}
            >
              Buy now for {aed(lot.buyNow)}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => (inCompare ? removeFromCompare(lot.id) : addToCompare(lot.id))}
            disabled={!inCompare && compareIds.length >= 3}
          >
            {inCompare ? <Check size={15} /> : <Plus size={15} />} Compare
          </Button>
        </div>
      )}

      <Dialog open={inspectionOpen} onClose={() => setInspectionOpen(false)} title="Request inspection">
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">An independent inspector visits the warehouse and reports back before bidding closes.</p>
          <p className="text-sm text-ink">Fixed fee: {aed(750)}</p>
          <Button
            className="w-full"
            onClick={() => {
              toast('Inspection requested. You will be notified when the report is ready.');
              setInspectionOpen(false);
            }}
          >
            Confirm booking
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

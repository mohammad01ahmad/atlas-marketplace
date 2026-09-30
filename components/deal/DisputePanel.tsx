'use client';

import { useState } from 'react';
import { useAtlasStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { MoneyRow } from '@/components/ui/MoneyRow';
import { Countdown } from '@/components/ui/Countdown';
import { aed } from '@/lib/format';

const REASONS = ['Units missing after count', 'Grade below tolerance', 'Wrong items'];

/** PRD 8.10: dispute open (buyer) and response (seller), within the deal tracker. */
export function DisputePanel({ dealId, role }: { dealId: string; role: 'buyer' | 'seller' }) {
  const deal = useAtlasStore((s) => s.deals.find((d) => d.id === dealId));
  const openDispute = useAtlasStore((s) => s.openDispute);
  const respondToDispute = useAtlasStore((s) => s.respondToDispute);
  const acceptDisputeCredit = useAtlasStore((s) => s.acceptDisputeCredit);

  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [partialAmount, setPartialAmount] = useState(0);

  if (!deal) return null;

  if (role === 'buyer' && deal.state === 'Inspection window') {
    const expectedCredit = deal.count?.creditAmount ?? 0;
    return (
      <div className="space-y-3 rounded-[10px] border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Raise a dispute</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink">
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-line bg-paper p-3 text-sm text-ink outline-none focus-visible:border-primary"
          />
        </div>
        <p className="text-xs text-ink-muted">Expected outcome from the published table: a credit of {aed(expectedCredit)}.</p>
        <Button onClick={() => openDispute(dealId, { reason, description, evidence: ['placeholder-evidence.svg'] })}>Submit dispute</Button>
      </div>
    );
  }

  if (role === 'seller' && deal.state === 'Disputed' && deal.dispute && !deal.dispute.sellerResponse) {
    return (
      <div className="space-y-3 rounded-[10px] border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Dispute: {deal.dispute.reason}</h3>
        <p className="text-sm text-ink-muted">{deal.dispute.description}</p>
        <Countdown target={deal.dispute.respondBy} prefix="Respond within" />
        <input
          type="number"
          value={partialAmount}
          onChange={(e) => setPartialAmount(Number(e.target.value) || 0)}
          placeholder="Partial credit amount (AED)"
          className="h-9 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus-visible:border-primary"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => respondToDispute(dealId, 'Accepted')}>
            Accept claim
          </Button>
          <Button size="sm" variant="secondary" onClick={() => respondToDispute(dealId, 'Partial credit', partialAmount)}>
            Propose partial credit
          </Button>
          <Button size="sm" variant="secondary" onClick={() => respondToDispute(dealId, 'Contested')}>
            Contest with evidence
          </Button>
        </div>
      </div>
    );
  }

  if (role === 'buyer' && deal.state === 'Disputed' && deal.dispute?.sellerResponse === 'Partial credit' && deal.dispute.sellerOfferedCredit !== undefined) {
    return (
      <div className="space-y-3 rounded-[10px] border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Seller offered a partial credit</h3>
        <MoneyRow label="Offered credit" amount={deal.dispute.sellerOfferedCredit} strong />
        <Button onClick={() => acceptDisputeCredit(dealId)}>Accept credit</Button>
      </div>
    );
  }

  if (deal.dispute?.resolution) {
    return (
      <div className="space-y-2 rounded-[10px] border border-line bg-surface p-4">
        <h3 className="text-sm font-semibold">Dispute resolved</h3>
        <p className="text-sm text-ink-muted">{deal.dispute.resolution.note}</p>
        <MoneyRow label="Credit" amount={deal.dispute.resolution.credit} strong />
      </div>
    );
  }

  return null;
}

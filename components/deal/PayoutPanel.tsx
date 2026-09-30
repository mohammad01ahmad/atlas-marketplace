import { ShieldCheck } from 'lucide-react';
import type { Payout } from '@/types';
import { MoneyRow } from '@/components/ui/MoneyRow';
import { Badge } from '@/components/ui/Badge';

/** PRD 8.15: winning bid, credits, commission, net payout, "Paid by partner bank". */
export function PayoutPanel({ payout }: { payout: Payout }) {
  return (
    <div data-tour="payout-panel" className="space-y-1 rounded-[10px] border border-line bg-surface p-4">
      <h3 className="mb-2 text-sm font-semibold">Payout</h3>
      <MoneyRow label="Winning bid" amount={payout.gross} muted />
      {payout.credit > 0 && <MoneyRow label="Credit" amount={-payout.credit} muted />}
      <MoneyRow label="Commission (5%)" amount={-payout.commission} muted />
      <MoneyRow label="Net payout" amount={payout.net} strong />
      <div className="pt-2">
        <Badge tone="primary" icon={ShieldCheck}>
          Paid by partner bank
        </Badge>
      </div>
    </div>
  );
}

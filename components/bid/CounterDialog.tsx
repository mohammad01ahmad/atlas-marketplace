'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { aed } from '@/lib/format';

export function CounterDialog({
  open,
  onClose,
  currentAmount,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  currentAmount: number;
  onSubmit: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(currentAmount);

  return (
    <Dialog open={open} onClose={onClose} title="Send a counter">
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">The buyer's current bid is {aed(currentAmount)}. Propose a matching or higher amount. The buyer has 24 hours to respond.</p>
        <div>
          <label htmlFor="counter-amount" className="mb-1 block text-xs font-medium text-ink-muted">
            Counter amount (AED)
          </label>
          <input
            id="counter-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="h-10 w-full rounded-md border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none focus-visible:border-primary"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(amount);
              onClose();
            }}
          >
            Send counter
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

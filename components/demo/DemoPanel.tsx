'use client';

import { useState } from 'react';
import { Settings2, X } from 'lucide-react';
import { useAtlasStore, useNow } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/format';
import { toast } from '@/lib/toast';

/** PRD 8.18. Desktop only, floating bottom right, hidden while the tour runs. */
export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const tourActive = useAtlasStore((s) => s.tourActive);
  const now = useNow();
  const advanceClock = useAtlasStore((s) => s.advanceClock);
  const jumpToNextDeadline = useAtlasStore((s) => s.jumpToNextDeadline);
  const resetDemo = useAtlasStore((s) => s.resetDemo);
  const scenarioAddCompetingBid = useAtlasStore((s) => s.scenarioAddCompetingBid);
  const scenarioBuyerMissesFunding = useAtlasStore((s) => s.scenarioBuyerMissesFunding);
  const scenarioSimulateShortage = useAtlasStore((s) => s.scenarioSimulateShortage);
  const scenarioSellerNoDisputeResponse = useAtlasStore((s) => s.scenarioSellerNoDisputeResponse);
  const deals = useAtlasStore((s) => s.deals);

  if (tourActive) return null;

  const shortageableDeal = deals.find((d) => d.state === 'Collection scheduled');

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden lg:block">
      {open ? (
        <div className="w-80 rounded-[10px] border border-line bg-surface p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Demo panel</h3>
            <button type="button" aria-label="Close demo panel" onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
              <X size={16} />
            </button>
          </div>

          <div className="mb-4 rounded-md border border-line bg-paper p-3">
            <p className="text-xs text-ink-muted">Simulated clock</p>
            <p className="mb-2 text-sm font-medium tabular-nums">{formatDateTime(new Date(now).toISOString())}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => advanceClock(1)}>
                +1 hour
              </Button>
              <Button size="sm" variant="secondary" onClick={() => advanceClock(24)}>
                +1 day
              </Button>
              <Button size="sm" variant="secondary" onClick={() => jumpToNextDeadline()}>
                Jump to next deadline
              </Button>
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <p className="text-xs text-ink-muted">Scenario triggers</p>
            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-start"
              onClick={() => {
                scenarioAddCompetingBid();
                toast('Added a competing bid.');
              }}
            >
              Add a competing bid
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-start"
              onClick={() => {
                scenarioBuyerMissesFunding();
                toast('Buyer missed the funding deadline.');
              }}
            >
              Buyer misses funding deadline
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-start"
              disabled={!shortageableDeal}
              onClick={() => {
                if (!shortageableDeal) return;
                scenarioSimulateShortage(shortageableDeal.id);
                toast('The next collection count will show a shortage.');
              }}
            >
              Simulate a shortage at collection
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-start"
              onClick={() => {
                scenarioSellerNoDisputeResponse();
                toast('Seller did not respond to the dispute.');
              }}
            >
              Seller does not respond to dispute
            </Button>
          </div>

          <Button
            size="sm"
            variant="danger"
            className="w-full"
            onClick={() => {
              resetDemo();
              toast('Demo data reset.');
            }}
          >
            Reset demo data
          </Button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Open demo panel"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-lg hover:text-ink"
        >
          <Settings2 size={18} />
        </button>
      )}
    </div>
  );
}

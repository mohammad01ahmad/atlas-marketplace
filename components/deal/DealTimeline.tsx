import { Fragment } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import type { Deal, DealState } from '@/types';
import { formatDateTime } from '@/lib/format';
import { StateBadge } from '@/components/ui/StateBadge';

const MAIN_STEPS: DealState[] = ['Awarded', 'Funded', 'Collection scheduled', 'Counted', 'Inspection window', 'Completed'];

/** Horizontal on desktop, vertical on mobile (PRD 5.5). */
export function DealTimeline({ deal }: { deal: Deal }) {
  const timelineMap = new Map(deal.timeline.map((t) => [t.state, t.at]));
  const onMainPath = MAIN_STEPS.includes(deal.state);

  return (
    <div data-tour="deal-timeline" className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
      {MAIN_STEPS.map((step, i) => {
        const at = timelineMap.get(step);
        const done = at !== undefined && step !== deal.state;
        const isCurrent = step === deal.state;
        return (
          <Fragment key={step}>
            <div className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${isCurrent ? 'bg-primary-soft' : ''}`}>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  done ? 'bg-primary text-white' : isCurrent ? 'border-2 border-primary text-primary' : 'border-2 border-line text-ink-muted'
                }`}
              >
                {done ? <Check size={12} /> : i + 1}
              </span>
              <div>
                <p className={`text-xs font-medium ${done || isCurrent ? 'text-ink' : 'text-ink-muted'}`}>{step}</p>
                {at && <p className="text-[10px] text-ink-muted">{formatDateTime(at)}</p>}
              </div>
            </div>
            {i < MAIN_STEPS.length - 1 && <ChevronRight size={14} className="hidden shrink-0 text-line sm:block" />}
          </Fragment>
        );
      })}
      {!onMainPath && (
        <>
          <ChevronRight size={14} className="hidden shrink-0 text-line sm:block" />
          <StateBadge state={deal.state} />
        </>
      )}
    </div>
  );
}

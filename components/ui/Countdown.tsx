'use client';

import { useNow } from '@/lib/store';
import { countdownText } from '@/lib/format';

/** "Fund escrow within 31h 12m", turning --warning under 6h (PRD 5.5). */
export function Countdown({ target, prefix }: { target: string; prefix?: string }) {
  const now = useNow();
  const ms = new Date(target).getTime() - now;
  const text = countdownText(ms);
  const urgent = ms > 0 && ms < 6 * 3600_000;
  return (
    <span className={`tabular-nums text-sm font-medium ${urgent ? 'text-warning' : ms <= 0 ? 'text-ink-muted' : 'text-ink'}`}>
      {prefix ? `${prefix} ${text}` : text}
    </span>
  );
}

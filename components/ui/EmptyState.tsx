import Link from 'next/link';
import { Button } from './Button';

/** One sentence of direction and one action (PRD 5.5). */
export function EmptyState({
  text,
  actionLabel,
  actionHref,
}: {
  text: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-line py-12 text-center">
      <p className="max-w-sm text-sm text-ink-muted">{text}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="secondary" size="sm">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

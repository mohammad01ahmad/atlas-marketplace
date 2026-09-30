import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/** A box at the top of every deal page: one sentence and one primary action (PRD 5.5). */
export function NextStepPanel({
  text,
  actionLabel,
  href,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-primary-soft p-4">
      <p className="mb-1 text-xs font-medium text-primary">What happens next</p>
      <p className="text-sm text-ink">{text}</p>
      {actionLabel &&
        (href ? (
          <Link href={href}>
            <Button size="sm" className="mt-3">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button size="sm" className="mt-3" onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}

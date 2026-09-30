import { aed } from '@/lib/format';

export function MoneyRow({
  label,
  amount,
  muted,
  strong,
}: {
  label: string;
  amount: number;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between py-1.5 text-sm ${muted ? 'text-ink-muted' : 'text-ink'}`}>
      <span className={strong ? 'font-semibold' : ''}>{label}</span>
      <span className={`tabular-nums ${strong ? 'text-base font-semibold' : ''}`}>{aed(amount)}</span>
    </div>
  );
}

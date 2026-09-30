// Kraft-coloured tag chip with a notch, PRD 5.5. The one distinctive design
// element: reinforces that lots are sealed and provable.

export function SealTag({ sealId, intact }: { sealId: string; intact?: boolean }) {
  return (
    <span
      className="relative inline-flex items-center gap-1 border py-0.5 pl-3 pr-2 text-xs font-medium tabular-nums"
      style={{
        borderColor: intact === false ? 'var(--danger)' : 'var(--kraft)',
        color: intact === false ? 'var(--danger)' : '#6b4f2a',
        background: intact === false ? 'var(--danger-soft)' : '#f6efe2',
        borderRadius: 2,
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
        style={{ border: `1px solid ${intact === false ? 'var(--danger)' : 'var(--kraft)'}` }}
      />
      {sealId}
    </span>
  );
}

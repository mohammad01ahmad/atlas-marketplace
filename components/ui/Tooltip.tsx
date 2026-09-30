import { Info } from 'lucide-react';

/** A small info tooltip with a one-sentence definition (PRD 6.4). CSS-only, no JS. */
export function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" className="inline-flex text-ink-muted hover:text-ink" aria-label={text}>
        <Info size={14} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md border border-line bg-ink px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

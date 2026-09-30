/** "Step 3 of 8" with a short line of guidance (PRD 6.1, 6.4). */
export function StepIndicator({ step, total, label }: { step: number; total: number; label?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-primary' : 'bg-line'}`} />
        ))}
      </div>
      <p className="text-xs font-medium text-ink-muted">
        Step {step} of {total}
        {label ? ` — ${label}` : ''}
      </p>
    </div>
  );
}

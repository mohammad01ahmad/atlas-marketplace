import { ImageIcon } from 'lucide-react';
import type { Grade, SampleEvidence } from '@/types';
import { pct } from '@/lib/format';

const GRADE_DEFINITIONS: Record<Grade, string> = {
  'New sealed': 'Unopened retail packaging, never sold or used.',
  'New open box': 'Retail packaging opened for inspection or display; contents unused.',
  'Returns tested': 'Customer returns, powered on and function-tested by the seller.',
  'Returns untested': 'Customer returns with no functional testing performed.',
  Salvage: 'Damaged, incomplete or non-functional stock sold for parts or scrap value.',
};

export function GradeEvidence({
  grade,
  tolerancePct,
  sampleEvidence,
}: {
  grade: Grade;
  tolerancePct: number;
  sampleEvidence: SampleEvidence[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-ink">{grade}</p>
        <p className="text-sm text-ink-muted">{GRADE_DEFINITIONS[grade]}</p>
        <p className="mt-1 text-sm text-ink-muted">Up to {pct(tolerancePct, 0)} of units may fall one grade below.</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-ink-muted">Samples selected by Atlas</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sampleEvidence.map((s) => (
            <div key={s.sku} className="rounded-md border border-line bg-paper p-2">
              <div className="mb-2 grid grid-cols-2 gap-1">
                {s.photos.map((p, i) => (
                  <div key={i} className="flex aspect-square items-center justify-center rounded bg-line/40 text-ink-muted">
                    <ImageIcon size={16} />
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium text-ink">{s.sku}</p>
              {s.testResult && <p className="mt-0.5 text-xs text-ink-muted">{s.testResult}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

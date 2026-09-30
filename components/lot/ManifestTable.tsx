import type { ManifestLine } from '@/types';
import { aed } from '@/lib/format';

/** Sortable in spirit; kept to close order since manifests read top to bottom like a packing list. Totals row, high-value lines flagged (PRD 8.4.3). */
export function ManifestTable({ lines }: { lines: ManifestLine[] }) {
  const withTotals = lines.map((l) => ({ ...l, lineTotal: l.qty * l.unitRetailValue }));
  const grandTotal = withTotals.reduce((s, l) => s + l.lineTotal, 0);
  const threshold = [...withTotals].sort((a, b) => b.lineTotal - a.lineTotal)[Math.floor(withTotals.length * 0.2)]?.lineTotal ?? Infinity;

  return (
    <div className="overflow-x-auto rounded-[10px] border border-line" data-tour="manifest-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-paper text-left text-xs font-medium text-ink-muted">
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Grade</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Unit retail</th>
            <th className="px-3 py-2 text-right">Line total</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {withTotals.map((l) => (
            <tr key={l.sku} className={`border-b border-line last:border-0 ${l.lineTotal >= threshold ? 'bg-warning-soft/40' : ''}`}>
              <td className="px-3 py-2 text-ink-muted">{l.sku}</td>
              <td className="px-3 py-2">
                {l.product}
                {l.expiry && <span className="ml-1.5 text-xs text-ink-muted">exp {l.expiry}</span>}
              </td>
              <td className="px-3 py-2 text-ink-muted">{l.grade}</td>
              <td className="px-3 py-2 text-right">{l.qty.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{aed(l.unitRetailValue)}</td>
              <td className="px-3 py-2 text-right font-medium">{aed(l.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-paper font-semibold">
            <td className="px-3 py-2" colSpan={3}>
              Total
            </td>
            <td className="px-3 py-2 text-right">{withTotals.reduce((s, l) => s + l.qty, 0).toLocaleString()}</td>
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-right">{aed(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

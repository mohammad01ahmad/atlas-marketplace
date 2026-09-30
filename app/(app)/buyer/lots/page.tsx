'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAtlasStore } from '@/lib/store';
import { estimateLandedCostPerUnit } from '@/lib/rules';
import { LotCard } from '@/components/lot/LotCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/toast';
import type { Category, Emirate, Grade } from '@/types';

const CATEGORIES: Category[] = ['Electronics', 'Cosmetics', 'Apparel', 'Household'];
const GRADES: Grade[] = ['New sealed', 'New open box', 'Returns tested', 'Returns untested', 'Salvage'];
const EMIRATES: Emirate[] = ['Dubai', 'Sharjah', 'Ajman'];
const SORTS = ['Closing soonest', 'Lowest cost per unit', 'Highest recovery discount', 'Newest'] as const;

export default function BrowseLotsPage() {
  const q = useSearchParams().get('q') ?? '';
  const allLots = useAtlasStore((s) => s.lots);
  const lots = allLots.filter((l) => l.state === 'Live');
  const companies = useAtlasStore((s) => s.companies);
  const comparables = useAtlasStore((s) => s.comparables);
  const saveSearch = useAtlasStore((s) => s.saveSearch);

  const [category, setCategory] = useState<Category | ''>('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [emirate, setEmirate] = useState<Emirate | ''>('');
  const [maxCost, setMaxCost] = useState('');
  const [minAccuracy, setMinAccuracy] = useState(false);
  const [closingSoon, setClosingSoon] = useState(false);
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Closing soonest');

  const filtered = useMemo(() => {
    let list = lots.filter((l) => (q ? l.title.toLowerCase().includes(q.toLowerCase()) : true));
    if (category) list = list.filter((l) => l.category === category);
    if (grade) list = list.filter((l) => l.grade === grade);
    if (emirate) list = list.filter((l) => l.warehouse.emirate === emirate);
    if (minAccuracy) list = list.filter((l) => (companies.find((c) => c.id === l.sellerId)?.manifestAccuracy ?? 0) >= 0.95);
    if (closingSoon) list = list.filter((l) => new Date(l.closesAt).getTime() - Date.now() < 24 * 3600_000);
    if (maxCost) list = list.filter((l) => estimateLandedCostPerUnit(l, comparables) <= Number(maxCost));

    const withMeta = list.map((l) => ({
      lot: l,
      cost: estimateLandedCostPerUnit(l, comparables),
      recovery: comparables.length ? 1 - (comparables.find((c) => c.category === l.category && c.grade === l.grade)?.recoveryPct ?? 0.2) : 0.2,
    }));

    switch (sort) {
      case 'Lowest cost per unit':
        withMeta.sort((a, b) => a.cost - b.cost);
        break;
      case 'Highest recovery discount':
        withMeta.sort((a, b) => b.recovery - a.recovery);
        break;
      case 'Newest':
        withMeta.sort((a, b) => new Date(b.lot.opensAt).getTime() - new Date(a.lot.opensAt).getTime());
        break;
      default:
        withMeta.sort((a, b) => new Date(a.lot.closesAt).getTime() - new Date(b.lot.closesAt).getTime());
    }
    return withMeta.map((x) => x.lot);
  }, [lots, q, category, grade, emirate, minAccuracy, closingSoon, maxCost, sort, companies, comparables]);

  function clearFilters() {
    setCategory('');
    setGrade('');
    setEmirate('');
    setMaxCost('');
    setMinAccuracy(false);
    setClosingSoon(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Browse lots</h1>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            saveSearch({ label: [category, grade, emirate].filter(Boolean).join(', ') || 'All lots', filters: { category: category || undefined, grade: grade || undefined, emirate: emirate || undefined } });
            toast('Search saved.');
          }}
        >
          Save search
        </Button>
      </div>

      <div data-tour="browse-filters" className="flex flex-wrap items-center gap-2 rounded-[10px] border border-line bg-surface p-3">
        <Select label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
        <Select label="Grade" value={grade} onChange={setGrade} options={GRADES} />
        <Select label="Emirate" value={emirate} onChange={setEmirate} options={EMIRATES} />
        <input
          type="number"
          value={maxCost}
          onChange={(e) => setMaxCost(e.target.value)}
          placeholder="Max cost / unit (AED)"
          className="h-9 w-44 rounded-md border border-line bg-paper px-2.5 text-sm text-ink outline-none focus-visible:border-primary"
        />
        <label className="flex items-center gap-1.5 text-sm text-ink">
          <input type="checkbox" checked={minAccuracy} onChange={(e) => setMinAccuracy(e.target.checked)} /> Accuracy ≥95%
        </label>
        <label className="flex items-center gap-1.5 text-sm text-ink">
          <input type="checkbox" checked={closingSoon} onChange={(e) => setClosingSoon(e.target.checked)} /> Closing within 24h
        </label>
        <button type="button" onClick={clearFilters} className="ml-auto text-xs font-medium text-ink-muted hover:text-ink">
          Clear filters
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])} className="h-9 rounded-md border border-line bg-paper px-2.5 text-sm text-ink">
          {SORTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No lots match. Widen the cost range or clear filters." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </div>
  );
}

function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T | ''; onChange: (v: T | '') => void; options: readonly T[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T | '')} className="h-9 rounded-md border border-line bg-paper px-2.5 text-sm text-ink">
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

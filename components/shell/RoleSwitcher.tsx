'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAtlasStore } from '@/lib/store';
import { equivalentRoute } from '@/lib/routes';
import { toast } from '@/lib/toast';
import type { Role } from '@/types';

/** Segmented Buyer / Seller control, PRD 4.2. Shows the active company name beneath. */
export function RoleSwitcher() {
  const role = useAtlasStore((s) => s.role);
  const switchRole = useAtlasStore((s) => s.switchRole);
  const companies = useAtlasStore((s) => s.companies);
  const activeBuyerId = useAtlasStore((s) => s.activeBuyerId);
  const activeSellerId = useAtlasStore((s) => s.activeSellerId);
  const router = useRouter();
  const pathname = usePathname();

  const nameFor = (r: Role) => companies.find((c) => c.id === (r === 'buyer' ? activeBuyerId : activeSellerId))?.name ?? '';

  function handleSwitch(next: Role) {
    if (next === role) return;
    const dest = equivalentRoute(pathname, next);
    switchRole(next);
    router.push(dest);
    toast(`Now viewing as ${nameFor(next)} (${next}).`);
  }

  return (
    <div className="flex flex-col items-end">
      <div role="group" aria-label="Switch role" className="inline-flex rounded-md border border-line bg-paper p-0.5 text-sm">
        <button
          type="button"
          onClick={() => handleSwitch('buyer')}
          className={`rounded px-3 py-1 font-medium ${role === 'buyer' ? 'bg-surface text-primary shadow-sm' : 'text-ink-muted'}`}
        >
          Buyer
        </button>
        <button
          type="button"
          onClick={() => handleSwitch('seller')}
          className={`rounded px-3 py-1 font-medium ${role === 'seller' ? 'bg-surface text-primary shadow-sm' : 'text-ink-muted'}`}
        >
          Seller
        </button>
      </div>
      <span className="mt-1 text-xs text-ink-muted">{nameFor(role)}</span>
    </div>
  );
}

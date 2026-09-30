'use client';

import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, PackageCheck } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import type { Role } from '@/types';

// PRD 8.1
export default function LandingPage() {
  const router = useRouter();
  const switchRole = useAtlasStore((s) => s.switchRole);
  const startTour = useAtlasStore((s) => s.startTour);
  const tourDone = useAtlasStore((s) => s.tourDone);

  function chooseRole(role: Role) {
    switchRole(role);
    if (!tourDone[role]) startTour(role);
    router.push(role === 'buyer' ? '/buyer' : '/seller');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-ink sm:text-[32px]">Atlas</h1>
      <p className="mt-3 max-w-xl text-base text-ink-muted">
        Existing liquidation platforms move the risk onto the buyer. Atlas makes the lot provable: sealed, counted at
        handover, and paid through escrow only when it matches.
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        <Point icon={Lock} text="Sealed lots" />
        <Point icon={ShieldCheck} text="Sealed bids" />
        <Point icon={PackageCheck} text="Escrow until counted" />
      </div>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => chooseRole('buyer')}
          className="rounded-[10px] border border-line bg-surface p-6 text-left transition-colors hover:border-primary hover:bg-primary-soft"
        >
          <p className="text-sm font-medium text-ink-muted">Continue as buyer</p>
          <p className="mt-1 text-base font-semibold text-ink">Horizon Exports FZE</p>
        </button>
        <button
          type="button"
          onClick={() => chooseRole('seller')}
          className="rounded-[10px] border border-line bg-surface p-6 text-left transition-colors hover:border-primary hover:bg-primary-soft"
        >
          <p className="text-sm font-medium text-ink-muted">Continue as seller</p>
          <p className="mt-1 text-base font-semibold text-ink">Al Noor General Trading LLC</p>
        </button>
      </div>
    </main>
  );
}

function Point({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink">
      <Icon size={16} className="text-primary" />
      {text}
    </div>
  );
}

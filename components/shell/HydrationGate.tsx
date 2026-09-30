'use client';

import { useEffect, useState } from 'react';
import { useAtlasStore } from '@/lib/store';

/**
 * Rehydrates the persisted store on the client and seeds fresh demo data on
 * first visit, so the server-rendered shell never depends on Date.now() or
 * localStorage (which would mismatch during hydration).
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAtlasStore((s) => s.hasHydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    useAtlasStore.persist.rehydrate();
    useAtlasStore.getState().hydrate();
  }, []);

  if (!mounted || !hasHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper text-sm text-ink-muted">
        Loading Atlas…
      </div>
    );
  }

  return <>{children}</>;
}

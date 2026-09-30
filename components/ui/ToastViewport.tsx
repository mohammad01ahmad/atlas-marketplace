'use client';

import { useToastStore } from '@/lib/toast';

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto rounded-md border border-line bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {t.message}
        </div>
      ))}
    </div>
  );
}

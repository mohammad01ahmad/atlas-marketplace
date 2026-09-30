'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useAtlasStore } from '@/lib/store';
import { Dialog } from '@/components/ui/Dialog';

/** Persistent Help button: Restart tour and How Atlas works (PRD 6.1). */
export function HelpButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const startTour = useAtlasStore((s) => s.startTour);
  const role = useAtlasStore((s) => s.role);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Help"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-primary-soft hover:text-ink"
      >
        <HelpCircle size={18} />
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border border-line bg-surface py-1 shadow-lg">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-primary-soft"
              onClick={() => {
                setMenuOpen(false);
                startTour(role);
              }}
            >
              Restart tour
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-primary-soft"
              onClick={() => {
                setMenuOpen(false);
                setHowOpen(true);
              }}
            >
              How Atlas works
            </button>
          </div>
        </>
      )}
      <Dialog open={howOpen} onClose={() => setHowOpen(false)} title="How Atlas works">
        <div className="space-y-3 text-sm leading-relaxed text-ink">
          <p>
            Atlas is a B2B auction marketplace for surplus stock held in UAE warehouses. Verified sellers list sealed,
            manifested lots; verified buyers submit sealed bids with terms attached.
          </p>
          <p>Money moves through escrow and is released to the seller only after the buyer counts the stock at collection against its seals.</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>A seller lists a lot: manifest, grade, provenance, sealed cartons, reserve and terms.</li>
            <li>Verified buyers browse, ask questions, and place sealed bids with a small refundable deposit.</li>
            <li>When bidding closes, the seller accepts, counters, or calls a best and final round.</li>
            <li>The winning buyer funds escrow within 48 hours, then books a collection slot.</li>
            <li>At collection, the buyer counts cartons against their seals. Any shortage adjusts the price automatically.</li>
            <li>After a 72 hour inspection window with no dispute, the seller is paid.</li>
          </ol>
        </div>
      </Dialog>
    </div>
  );
}

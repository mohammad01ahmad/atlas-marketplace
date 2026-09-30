'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAtlasStore } from '@/lib/store';
import { BUYER_TOUR, SELLER_TOUR } from '@/lib/tourSteps';
import { Button } from '@/components/ui/Button';

export function TourOverlay() {
  const tourActive = useAtlasStore((s) => s.tourActive);
  const role = useAtlasStore((s) => s.role);
  const step = useAtlasStore((s) => s.tourStep);
  const setStep = useAtlasStore((s) => s.setTourStep);
  const skip = useAtlasStore((s) => s.skipTour);
  const finish = useAtlasStore((s) => s.finishTour);
  const router = useRouter();
  const pathname = usePathname();

  const steps = role === 'buyer' ? BUYER_TOUR : SELLER_TOUR;
  const current = steps[step];
  const [rect, setRect] = useState<DOMRect | null>(null);

  const next = useCallback(() => {
    if (step + 1 >= steps.length) finish();
    else setStep(step + 1);
  }, [step, steps.length, finish, setStep]);
  const back = useCallback(() => setStep(Math.max(0, step - 1)), [step, setStep]);

  useEffect(() => {
    if (!tourActive || !current) return;
    const targetPath = current.href.split('?')[0];
    if (pathname !== targetPath) router.push(current.href);
  }, [tourActive, current, pathname, router]);

  useEffect(() => {
    if (!tourActive || !current?.anchor) {
      setRect(null);
      return;
    }
    let attempts = 0;
    let raf = 0;
    const tryFind = () => {
      const el = document.querySelector(`[data-tour="${current.anchor}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setRect(el.getBoundingClientRect());
      } else if (attempts++ < 40) {
        raf = requestAnimationFrame(tryFind);
      }
    };
    tryFind();
    return () => cancelAnimationFrame(raf);
  }, [tourActive, current, pathname, step]);

  useEffect(() => {
    if (!tourActive) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') skip();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourActive, next, back, skip]);

  if (!tourActive || !current) return null;
  const isWelcome = !current.anchor;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-ink/30" onClick={skip} />
      {isWelcome ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[10px] border border-line bg-surface p-6 shadow-lg">
            <p className="mb-4 text-sm leading-relaxed text-ink">{current.text}</p>
            <TourControls step={step} total={steps.length} onBack={back} onNext={next} onSkip={skip} />
          </div>
        </div>
      ) : rect ? (
        <div
          className="absolute w-72 rounded-[10px] border border-line bg-surface p-4 shadow-lg"
          style={{
            top: Math.min(rect.bottom + 10, (typeof window !== 'undefined' ? window.innerHeight : 800) - 180),
            left: Math.min(Math.max(rect.left, 12), (typeof window !== 'undefined' ? window.innerWidth : 400) - 300),
          }}
        >
          <p className="mb-4 text-sm leading-relaxed text-ink">{current.text}</p>
          <TourControls step={step} total={steps.length} onBack={back} onNext={next} onSkip={skip} />
        </div>
      ) : null}
    </div>
  );
}

function TourControls({
  step,
  total,
  onBack,
  onNext,
  onSkip,
}: {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-ink-muted">
        Step {step + 1} of {total}
      </span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={onSkip} className="text-xs font-medium text-ink-muted hover:text-ink">
          Skip tour
        </button>
        {step > 0 && (
          <Button size="sm" variant="secondary" onClick={onBack}>
            Back
          </Button>
        )}
        <Button size="sm" onClick={onNext}>
          {step + 1 >= total ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

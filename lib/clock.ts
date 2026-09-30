// Simulated clock (PRD 3.3, A12). Seed data is written as hour offsets from a
// base time; the store fixes that base on first load / reset, so every demo
// deadline ("closes in 20 hours") lands relative to whenever you opened Atlas.

export function addHours(baseMs: number, hours: number): number {
  return baseMs + hours * 3600_000;
}

export function addDays(baseMs: number, days: number): number {
  return addHours(baseMs, days * 24);
}

/** ISO timestamp `hoursFromBase` hours after `baseMs`. */
export function isoAt(baseMs: number, hoursFromBase: number): string {
  return new Date(addHours(baseMs, hoursFromBase)).toISOString();
}

export function msRemaining(targetIso: string, nowMs: number): number {
  return new Date(targetIso).getTime() - nowMs;
}

export function isPast(targetIso: string, nowMs: number): boolean {
  return msRemaining(targetIso, nowMs) <= 0;
}

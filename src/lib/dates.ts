// Helpers for date math (UTC day boundaries)
export function todayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function toUTCDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isSameUTCDay(a: Date, b: Date): boolean {
  return ymd(toUTCDay(a)) === ymd(toUTCDay(b));
}

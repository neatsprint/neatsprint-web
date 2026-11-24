export function mondayOf(input: Date): Date {
  const date = new Date(
    Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
  );
  const day = date.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - offset);
  return date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function weekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

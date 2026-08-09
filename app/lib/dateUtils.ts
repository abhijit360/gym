import { startOfWeek, addDays, format, differenceInDays } from 'date-fns';

export function weekDays(ref: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(ref, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function daysBetween(aISO: string, bISO: string): number {
  return Math.abs(differenceInDays(new Date(aISO), new Date(bISO)));
}

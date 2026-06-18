import type { Entry } from "@/types/entry";
import { DEFAULT_HOURLY_RATE } from "@/types/settings";

export { DEFAULT_HOURLY_RATE };
export const REVIEW_BONUS = 20;

export function calculateEarnings(
  workHours: number,
  travelHours: number,
  reviews: number,
  tips: number,
  hourlyRate: number
): number {
  return (
    (workHours + travelHours) * hourlyRate + reviews * REVIEW_BONUS + tips
  );
}

export function calculateEntryEarnings(
  entry: Entry,
  hourlyRate: number
): number {
  return calculateEarnings(
    entry.workHours,
    entry.travelHours,
    entry.reviews,
    entry.tips,
    hourlyRate
  );
}

export function calculateTotalHours(entries: Entry[]): number {
  return entries.reduce(
    (total, entry) => total + entry.workHours + entry.travelHours,
    0
  );
}

export function calculateTotalReviews(entries: Entry[]): number {
  return entries.reduce((total, entry) => total + entry.reviews, 0);
}

export function calculateTotalTips(entries: Entry[]): number {
  return entries.reduce((total, entry) => total + entry.tips, 0);
}

export function calculateTotalEarnings(
  entries: Entry[],
  hourlyRate: number
): number {
  return entries.reduce(
    (total, entry) => total + calculateEntryEarnings(entry, hourlyRate),
    0
  );
}

import type { Entry } from "@/types/entry";

export const HOURLY_RATE = 25;
export const REVIEW_BONUS = 20;

export function calculateEarnings(
  workHours: number,
  travelHours: number,
  reviews: number,
  tips: number
): number {
  return (workHours + travelHours) * HOURLY_RATE + reviews * REVIEW_BONUS + tips;
}

export function calculateEntryEarnings(entry: Entry): number {
  return calculateEarnings(
    entry.workHours,
    entry.travelHours,
    entry.reviews,
    entry.tips
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

export function calculateTotalEarnings(entries: Entry[]): number {
  return entries.reduce(
    (total, entry) => total + calculateEntryEarnings(entry),
    0
  );
}

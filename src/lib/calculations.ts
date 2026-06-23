import type { Entry } from "@/types/entry";
import type { Settings } from "@/types/settings";

export function calculateEarnings(
  workHours: number,
  travelHours: number,
  reviews: number,
  tips: number,
  settings: Pick<Settings, "hourlyRate" | "reviewBonus">
): number {
  return (
    (workHours + travelHours) * settings.hourlyRate +
    reviews * settings.reviewBonus +
    tips
  );
}

export function calculateEntryEarnings(
  entry: Entry,
  settings: Pick<Settings, "hourlyRate" | "reviewBonus">
): number {
  return calculateEarnings(
    entry.workHours,
    entry.travelHours,
    entry.reviews,
    entry.tips,
    settings
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
  settings: Pick<Settings, "hourlyRate" | "reviewBonus">
): number {
  return entries.reduce(
    (total, entry) => total + calculateEntryEarnings(entry, settings),
    0
  );
}

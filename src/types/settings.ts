export interface Settings {
  hourlyRate: number;
  reviewBonus: number;
}

export const DEFAULT_HOURLY_RATE = 25;
export const DEFAULT_REVIEW_BONUS = 20;

export const DEFAULT_SETTINGS: Settings = {
  hourlyRate: DEFAULT_HOURLY_RATE,
  reviewBonus: DEFAULT_REVIEW_BONUS,
};

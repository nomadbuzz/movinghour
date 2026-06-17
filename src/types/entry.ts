export interface Entry {
  id: string;
  date: string;
  workHours: number;
  travelHours: number;
  reviews: number;
  tips: number;
}

export interface EntryInput {
  date: string;
  workHours: number;
  travelHours: number;
  reviews: number;
  tips: number;
}

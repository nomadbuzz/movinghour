export interface HoursMinutes {
  hours: number;
  minutes: number;
}

export function hoursMinutesToDecimalHours(
  hours: number,
  minutes: number
): number {
  return hours + minutes / 60;
}

export function decimalHoursToHoursMinutes(
  totalHours: number
): HoursMinutes {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  if (minutes === 60) {
    return { hours: hours + 1, minutes: 0 };
  }

  return { hours, minutes };
}

export function formatDecimalHours(totalHours: number): string {
  const { hours, minutes } = decimalHoursToHoursMinutes(totalHours);

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export const ISHA_HOUR = 20; 
export const FAJR_HOUR = 5;

export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= ISHA_HOUR || hour < FAJR_HOUR;
}

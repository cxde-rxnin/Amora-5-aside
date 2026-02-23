/**
 * Time slot utilities for the booking engine.
 *
 * Operating hours: 08:00 – 23:00
 * Slot intervals: 1 hour
 * Valid durations: 60 minutes (1 hour) or 120 minutes (2 hours)
 */

export const OPERATING_START = 8; // 08:00
export const OPERATING_END = 23; // 23:00
export const VALID_DURATIONS = [60, 120] as const;

/** Generate all possible hourly slot strings from 08:00 to 22:00 */
export function getAllSlots(): string[] {
  const slots: string[] = [];
  for (let h = OPERATING_START; h < OPERATING_END; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return slots;
}

/** Parse a time string like "18:00" into its hour number (18) */
export function parseHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

/** Calculate end time given a start time and duration in minutes */
export function calculateEndTime(startTime: string, duration: number): string {
  const startHour = parseHour(startTime);
  const endHour = startHour + duration / 60;
  return `${endHour.toString().padStart(2, "0")}:00`;
}

/**
 * Get all individual 1-hour slot strings that a booking occupies.
 * E.g., startTime "18:00" with duration 120 → ["18:00", "19:00"]
 */
export function getOccupiedSlots(
  startTime: string,
  duration: number
): string[] {
  const startHour = parseHour(startTime);
  const slotCount = duration / 60;
  const slots: string[] = [];
  for (let i = 0; i < slotCount; i++) {
    slots.push(`${(startHour + i).toString().padStart(2, "0")}:00`);
  }
  return slots;
}

/** Check if a start time + duration fits within operating hours */
export function isWithinOperatingHours(
  startTime: string,
  duration: number
): boolean {
  const startHour = parseHour(startTime);
  const endHour = startHour + duration / 60;
  return startHour >= OPERATING_START && endHour <= OPERATING_END;
}

/**
 * Normalize a date to midnight UTC (strip time portion).
 * This ensures consistent date comparison across timezones.
 */
export function normalizeDate(date: Date | string): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Check if a date string represents today or a future date */
export function isFutureOrToday(date: Date | string): boolean {
  const target = normalizeDate(date);
  const today = normalizeDate(new Date());
  return target >= today;
}

/** Format a date as YYYY-MM-DD for API queries */
export function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0];
}

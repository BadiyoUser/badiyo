// Business hours: 9 AM – 8 PM (last bookable start hour = 20)
export const BUSINESS_START_HOUR = 9;
export const BUSINESS_END_HOUR = 20;

export type HourSlot = {
  hour: number; // 24h
  label: string; // "9 AM"
  range: string; // "9 AM – 10 AM"
};

function formatHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${suffix}`;
}

export function getAllHourSlots(): HourSlot[] {
  const slots: HourSlot[] = [];
  for (let h = BUSINESS_START_HOUR; h <= BUSINESS_END_HOUR; h++) {
    slots.push({
      hour: h,
      label: formatHour(h),
      range: `${formatHour(h)} – ${formatHour(h + 1)}`,
    });
  }
  return slots;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isTodayKey(dateKey: string): boolean {
  return dateKey === toDateKey(new Date());
}

// For today, only allow hours strictly greater than the current hour
// (i.e. if it's 6:20 PM, the 7 PM slot onward is bookable).
export function isHourBookable(dateKey: string, hour: number): boolean {
  if (!isTodayKey(dateKey)) return true;
  const now = new Date();
  return hour > now.getHours();
}

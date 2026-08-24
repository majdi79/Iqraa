export const BAHRAIN_TIME_ZONE = 'Asia/Bahrain';

export function getBahrainDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BAHRAIN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function getBahrainDateArabic(): string {
  return new Intl.DateTimeFormat('ar-BH', {
    timeZone: BAHRAIN_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

export function getBahrainTime(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BAHRAIN_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export function getBahrainDateObject(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BAHRAIN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const day = Number(parts.find(p => p.type === 'day')?.value);

  return new Date(year, month - 1, day);
}

export function getBahrainStartOfMonth(): string {
  const d = getBahrainDateObject();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    '01',
  ].join('-');
}

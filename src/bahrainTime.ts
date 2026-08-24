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

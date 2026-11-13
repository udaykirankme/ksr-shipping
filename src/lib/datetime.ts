export const BUSINESS_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MINUTES = 330; // UTC+5:30

function parseDateParts(value: string) {
  const [datePart, timePart = '00:00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return { year, month, day, hours: hours || 0, minutes: minutes || 0, seconds: seconds || 0 };
}

/** Parse admin-entered date/time strings as India Standard Time (Hyderabad). */
export function parseBusinessDateTime(value: string | Date | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (!value) return new Date();

  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }

  const normalized = value.includes('T') ? value : `${value}T00:00:00`;
  const { year, month, day, hours, minutes, seconds } = parseDateParts(normalized);

  // Treat entered values as IST, then convert to an absolute UTC timestamp.
  const enteredAsUtcMs = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  return new Date(enteredAsUtcMs - IST_OFFSET_MINUTES * 60 * 1000);
}

/** Format timestamps for display in IST. */
export function formatBusinessDateTime(dateString: string | Date): string {
  if (!dateString) return 'N/A';
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: BUSINESS_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatBusinessDate(dateString: string | Date): string {
  if (!dateString) return 'N/A';
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: BUSINESS_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function toBusinessDateInput(date: string | Date): string {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

export function toBusinessTimeInput(date: string | Date): string {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}

export function getCurrentBusinessDateTimeInput(): string {
  const now = new Date();
  return `${toBusinessDateInput(now)}T${toBusinessTimeInput(now)}:00`;
}

/** Split stored timestamp into admin form date + time fields (IST). */
export function toBusinessDateTimeFields(date: string | Date) {
  return {
    date: toBusinessDateInput(date),
    time: toBusinessTimeInput(date),
  };
}

/** Inclusive start and exclusive end of a business month in IST. */
export function getBusinessMonthRange(month?: number, year?: number): { gte: Date; lt: Date } {
  const [currentYearStr, currentMonthStr] = toBusinessDateInput(new Date()).split('-');
  const targetYear = year ?? Number(currentYearStr);
  const targetMonth = month ?? Number(currentMonthStr);

  const gte = parseBusinessDateTime(
    `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00`,
  );

  const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1;
  const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear;
  const lt = parseBusinessDateTime(
    `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`,
  );

  return { gte, lt };
}

/**
 * Parse any courier EDD or user-input date into a pure UTC date-only Date object
 * (YYYY-MM-DDT00:00:00.000Z) for PostgreSQL @db.Date columns, avoiding timezone day drift.
 */
export function parseCalendarDate(rawDate: string | Date | null | undefined): Date | null {
  if (!rawDate) return null;
  if (rawDate instanceof Date) {
    if (isNaN(rawDate.getTime()) || rawDate.getFullYear() <= 1970) return null;
    return new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate(), 0, 0, 0, 0));
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // Match YYYY-MM-DD or YYYY/MM/DD prefix (common in ISO strings and courier dates)
  const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (year > 1970 && month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      // Strict calendar verification: prevent JavaScript auto-rollover (e.g. Feb 30 -> Mar 2)
      if (
        d.getUTCFullYear() === year &&
        d.getUTCMonth() === month &&
        d.getUTCDate() === day
      ) {
        return d;
      }
      return null;
    }
    return null;
  }

  // Fallback to standard Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
    const istDateStr = toBusinessDateInput(d);
    if (istDateStr) {
      const [y, m, day] = istDateStr.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, day, 0, 0, 0, 0));
    }
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }

  return null;
}

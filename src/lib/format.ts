import {
  formatBusinessDate,
  formatBusinessDateTime,
  toBusinessDateInput,
} from './datetime';

export function formatIndianNumberString(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).replace(/,/g, '');
  if (!str) return '';
  const parts = str.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts.slice(1).join('') : (str.endsWith('.') ? '.' : '');

  if (!integerPart) return decimalPart;

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  const formattedInteger = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  return formattedInteger + decimalPart;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | Date): string {
  return formatBusinessDate(dateString);
}

export function formatDateTime(dateString: string | Date): string {
  return formatBusinessDateTime(dateString);
}

export function formatDateToYYYYMMDD(date: Date): string {
  return toBusinessDateInput(date);
}

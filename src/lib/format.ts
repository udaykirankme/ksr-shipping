import {
  formatBusinessDate,
  formatBusinessDateTime,
  toBusinessDateInput,
} from './datetime';

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

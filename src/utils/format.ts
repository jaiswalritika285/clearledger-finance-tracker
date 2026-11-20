import type { CurrencyCode } from '../types/finance';

const CURRENCY_LOCALE_MAP: Record<CurrencyCode, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE_MAP[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE_MAP[currency] || 'en-US', {
    style: 'currency',
    currency,
    notation: Math.abs(amount) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(amount) >= 10000 ? 1 : 0,
  }).format(amount);
}

export function formatShortDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatShortMonth(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleDateString('en-US', { month: 'short' });
}

export function getMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  const nextYear = dt.getFullYear();
  const nextMonth = String(dt.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

export function escapeCsvCell(value: string | number | undefined): string {
  const raw = value === undefined ? '' : String(value);
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

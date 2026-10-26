export function formatCurrency(
  value: number,
  currency: string = 'USD',
  showSign: boolean = false
): string {
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absVal);

  if (isNegative) return `-${formatted}`;
  if (showSign && value > 0) return `+${formatted}`;
  return formatted;
}

export function formatPercent(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatRR(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return '—';
  return `1:${value.toFixed(1)}R`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

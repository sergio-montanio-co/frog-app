type FormatOptions = {
  compact?: boolean
  currency?: string
  locale?: string
}

export function formatMxn(value: string, opts: FormatOptions = {}): string {
  const { compact = false, currency = 'MXN', locale = 'es-MX' } = opts
  const num = Number.parseFloat(value)
  if (!Number.isFinite(num)) return ''
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(num)
}

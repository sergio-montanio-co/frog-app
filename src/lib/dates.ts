export type DateTranslate = (
  key: string,
  options?: { count?: number },
) => string

export function daysSince(date: Date, reference: Date = new Date()): number {
  const today = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  )
  const past = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((today.getTime() - past.getTime()) / 86_400_000)
}

export function formatRelativeTime(
  iso: string,
  t: DateTranslate,
  language: string,
): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60) return t('notifications.relativeTime.justNow')

  if (diffSec < 3600) {
    const minutes = Math.max(1, Math.floor(diffSec / 60))
    const key =
      minutes === 1
        ? 'notifications.relativeTime.minutesAgo.one'
        : 'notifications.relativeTime.minutesAgo.other'
    return t(key, { count: minutes })
  }

  if (diffSec < 86_400) {
    const hours = Math.floor(diffSec / 3600)
    const key =
      hours === 1
        ? 'notifications.relativeTime.hoursAgo.one'
        : 'notifications.relativeTime.hoursAgo.other'
    return t(key, { count: hours })
  }

  const days = daysSince(date, now)
  if (days < 7) {
    const key =
      days === 1
        ? 'notifications.relativeTime.daysAgo.one'
        : 'notifications.relativeTime.daysAgo.other'
    return t(key, { count: days })
  }

  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

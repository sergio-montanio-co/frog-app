import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Calendar, LocaleConfig } from 'react-native-calendars'

import { Icon } from './Icon'
import { InputShell } from './InputShell'
import { Text } from './Text'
import { colors } from '@/theme/colors'

if (!LocaleConfig.locales['es']) {
  LocaleConfig.locales['es'] = {
    monthNames: [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ],
    monthNamesShort: [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ],
    dayNames: [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  }
  LocaleConfig.defaultLocale = 'es'
}

export type DateRangeValue = {
  start: string | undefined
  end: string | undefined
}

export type DateRangeFieldProps = {
  label?: string
  startValue?: string
  endValue?: string
  onChange: (range: DateRangeValue) => void
  placeholder?: string
  error?: string
  helperText?: string
  minimumDate?: Date
  maximumDate?: Date
  startAccessibilityLabel?: string
  endAccessibilityLabel?: string
  className?: string
}

function isoToYmd(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ymdToIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0)
  return date.toISOString()
}

function formatDateForDisplay(iso: string | undefined, locale = 'es-MX'): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

function buildMarkedDates(
  startYmd: string | undefined,
  endYmd: string | undefined,
): Record<string, object> {
  if (!startYmd) return {}
  const periodColor = colors.primary
  const textColor = colors.background

  if (!endYmd || startYmd === endYmd) {
    return {
      [startYmd]: {
        startingDay: true,
        endingDay: true,
        color: periodColor,
        textColor,
      },
    }
  }

  const marked: Record<string, object> = {}
  const start = new Date(`${startYmd}T12:00:00`)
  const end = new Date(`${endYmd}T12:00:00`)
  const current = new Date(start)

  while (current.getTime() <= end.getTime()) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    const key = `${y}-${m}-${d}`
    marked[key] = {
      color: periodColor,
      textColor,
      ...(key === startYmd && { startingDay: true }),
      ...(key === endYmd && { endingDay: true }),
    }
    current.setDate(current.getDate() + 1)
  }
  return marked
}

export function DateRangeField({
  label,
  startValue,
  endValue,
  onChange,
  placeholder,
  error,
  helperText,
  minimumDate,
  maximumDate,
  startAccessibilityLabel,
  endAccessibilityLabel,
  className,
}: DateRangeFieldProps) {
  const [open, setOpen] = useState(false)

  const startYmd = useMemo(() => isoToYmd(startValue), [startValue])
  const endYmd = useMemo(() => isoToYmd(endValue), [endValue])

  const startDisplay = formatDateForDisplay(startValue)
  const endDisplay = formatDateForDisplay(endValue)

  const markedDates = useMemo(
    () => buildMarkedDates(startYmd, endYmd),
    [startYmd, endYmd],
  )

  function handleDayPress(day: { dateString: string }) {
    const ymd = day.dateString
    const iso = ymdToIso(ymd)

    if (!startYmd || (startYmd && endYmd)) {
      onChange({ start: iso, end: undefined })
      return
    }
    if (ymd < startYmd) {
      onChange({ start: iso, end: undefined })
      return
    }
    onChange({ start: ymdToIso(startYmd), end: iso })
    setOpen(false)
  }

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.background,
      calendarBackground: colors.background,
      textSectionTitleColor: colors.secondary,
      selectedDayBackgroundColor: colors.primary,
      selectedDayTextColor: colors.background,
      todayTextColor: colors.primary,
      dayTextColor: colors.foreground,
      textDisabledColor: colors.muted,
      arrowColor: colors.primary,
      monthTextColor: colors.foreground,
      textDayFontFamily: 'Quicksand_400Regular',
      textMonthFontFamily: 'Quicksand_600SemiBold',
      textDayHeaderFontFamily: 'Quicksand_500Medium',
      textDayFontSize: 14,
      textMonthFontSize: 16,
      textDayHeaderFontSize: 12,
    }),
    [],
  )

  const minYmd = minimumDate ? isoToYmd(minimumDate.toISOString()) : undefined
  const maxYmd = maximumDate ? isoToYmd(maximumDate.toISOString()) : undefined
  const initialMonth = startYmd ?? minYmd ?? undefined

  return (
    <View className="gap-2">
      <InputShell
        label={label}
        helperText={helperText}
        error={error}
        focused={open}
        leadingIcon="event"
        className={className}
      >
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel={
            startAccessibilityLabel ?? label ?? 'Seleccionar rango de fechas'
          }
          className="flex-1 flex-row items-center gap-2"
        >
          {startDisplay ? (
            <Text variant="body">{startDisplay}</Text>
          ) : (
            <Text variant="body" tone="muted">
              {placeholder ?? 'Inicio'}
            </Text>
          )}
          <Icon name="arrow-forward" size={16} color={colors.secondary} />
          {endDisplay ? (
            <Text variant="body">{endDisplay}</Text>
          ) : (
            <Text variant="body" tone="muted">
              {endAccessibilityLabel ?? 'Fin'}
            </Text>
          )}
        </Pressable>
      </InputShell>

      {open ? (
        <View className="overflow-hidden rounded-card border-hairline border-muted bg-background">
          <Calendar
            initialDate={initialMonth}
            minDate={minYmd}
            maxDate={maxYmd}
            markingType="period"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={calendarTheme}
            firstDay={1}
            enableSwipeMonths
          />
        </View>
      ) : null}
    </View>
  )
}

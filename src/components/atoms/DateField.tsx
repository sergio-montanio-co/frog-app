import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { InputShell } from './InputShell'
import { Text } from './Text'
import { colors } from '@/theme/colors'

export type DateFieldProps = {
  label?: string
  value?: string
  onChange: (iso: string | undefined) => void
  placeholder?: string
  error?: string
  helperText?: string
  minimumDate?: Date
  maximumDate?: Date
  accessibilityLabel?: string
  className?: string
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

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  minimumDate,
  maximumDate,
  accessibilityLabel,
  className,
}: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const display = formatDateForDisplay(value)
  const showInline = open && Platform.OS === 'ios'

  function handleChange(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') setOpen(false)
    if (event.type === 'dismissed' || !picked) return
    onChange(picked.toISOString())
  }

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
          accessibilityLabel={accessibilityLabel ?? label ?? 'Seleccionar fecha'}
          className="flex-1"
        >
          {display ? (
            <Text variant="body">{display}</Text>
          ) : (
            <Text variant="body" tone="muted">
              {placeholder ?? 'dd / mmm / aaaa'}
            </Text>
          )}
        </Pressable>
      </InputShell>

      {showInline ? (
        <View className="rounded-card border-hairline border-muted bg-background">
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display="inline"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            themeVariant="light"
            accentColor={colors.primary}
            locale="es-MX"
          />
        </View>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
    </View>
  )
}

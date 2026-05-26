import { forwardRef, useState } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'
import { Text } from './Text'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

export type MoneyInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'keyboardType' | 'inputMode'
> & {
  label?: string
  error?: string
  helperText?: string
  value: string
  onChangeText: (clean: string) => void
  currencyPrefix?: string
  className?: string
}

const CLEAN_RE = /[^0-9.]/g

function cleanInput(raw: string): string {
  let cleaned = raw.replace(CLEAN_RE, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot >= 0) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  const dotIdx = cleaned.indexOf('.')
  if (dotIdx >= 0) {
    cleaned = cleaned.slice(0, dotIdx + 3)
  }
  return cleaned
}

function formatWithThousands(value: string): string {
  if (!value) return ''
  const [whole, decimal] = value.split('.')
  const withSeparators = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimal !== undefined ? `${withSeparators}.${decimal}` : withSeparators
}

export const MoneyInput = forwardRef<TextInput, MoneyInputProps>(
  function MoneyInput(
    {
      label,
      error,
      helperText,
      value,
      onChangeText,
      currencyPrefix = '$',
      className,
      accessibilityLabel,
      placeholder,
      ...rest
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false)
    const display = focused ? value : formatWithThousands(value)

    return (
      <View className="gap-2">
        {label ? <Text variant="body-em">{label}</Text> : null}
        <View
          className={cn(
            'h-12 flex-row items-center rounded-card border-hairline border-muted bg-background px-4',
            error && 'border-primary',
            className,
          )}
        >
          <Text variant="body" tone="secondary" className="pr-2">
            {currencyPrefix}
          </Text>
          <TextInput
            ref={ref}
            value={display}
            onChangeText={(raw) => onChangeText(cleanInput(raw))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder ?? '0.00'}
            placeholderTextColor={colors.muted}
            inputMode="decimal"
            keyboardType="decimal-pad"
            accessibilityLabel={accessibilityLabel ?? label}
            className="flex-1 text-base font-sans text-foreground"
            {...rest}
          />
        </View>
        {error ? (
          <Text variant="caption" tone="primary">
            {error}
          </Text>
        ) : helperText ? (
          <Text variant="caption" tone="secondary">
            {helperText}
          </Text>
        ) : null}
      </View>
    )
  },
)

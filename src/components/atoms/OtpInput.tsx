import { useEffect } from 'react'
import { View } from 'react-native'
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field'
import { Text } from './Text'
import { cn } from '@/lib/cn'

export type OtpInputProps = {
  label?: string
  value: string
  onChangeText: (v: string) => void
  length?: number
  error?: string
  helperText?: string
  autoFocus?: boolean
  accessibilityLabel?: string
  /** Dispara cuando el usuario completa la longitud. Útil para auto-submit. */
  onComplete?: (v: string) => void
}

export function OtpInput({
  label,
  value,
  onChangeText,
  length = 6,
  error,
  helperText,
  autoFocus = true,
  accessibilityLabel,
  onComplete,
}: OtpInputProps) {
  const ref = useBlurOnFulfill({ value, cellCount: length })
  const [cellProps, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue: onChangeText,
  })

  useEffect(() => {
    if (value.length === length) onComplete?.(value)
    // onComplete intentionally excluded to avoid re-firing on prop identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length])

  return (
    <View className="gap-2">
      {label ? <Text variant="body-em">{label}</Text> : null}

      <CodeField
        ref={ref}
        {...cellProps}
        value={value}
        onChangeText={onChangeText}
        cellCount={length}
        autoFocus={autoFocus}
        rootStyle={{ gap: 8 }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        accessibilityLabel={accessibilityLabel ?? label}
        renderCell={({ index, symbol, isFocused }) => (
          <View
            key={index}
            onLayout={getCellOnLayoutHandler(index)}
            className={cn(
              'h-14 w-12 items-center justify-center rounded-card border bg-foreground/[0.03]',
              !error && !isFocused && 'border-muted',
              !error && isFocused && 'border-foreground/60',
              error && 'border-primary',
            )}
          >
            <Text variant="title">
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
          </View>
        )}
      />

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
}

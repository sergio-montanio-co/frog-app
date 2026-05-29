import { forwardRef, useState } from 'react'
import {
  Platform,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native'
import { InputShell } from './InputShell'
import { Text } from './Text'
import { colors } from '@/theme/colors'

const MONEY_INPUT_STYLE: StyleProp<TextStyle> = Platform.select({
  // UITextView (multiline) en iOS tiene textContainerInset (8,0,8,0) por
  // default. Lo anulamos con paddingTop/Bottom: 0 para que el texto no se
  // empuje hacia abajo del icono.
  ios: { height: 24, paddingTop: 0, paddingBottom: 0 },
  android: { padding: 0, margin: 0, includeFontPadding: false },
  default: null,
})

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
      editable = true,
      ...rest
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false)
    const display = focused ? value : formatWithThousands(value)

    return (
      <InputShell
        label={label}
        helperText={helperText}
        error={error}
        focused={focused}
        disabled={!editable}
        leadingContent={
          <Text variant="body" tone="secondary">
            {currencyPrefix}
          </Text>
        }
        className={className}
      >
        <TextInput
          ref={ref}
          value={display}
          onChangeText={(raw) => onChangeText(cleanInput(raw))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? '0.00'}
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          inputMode="decimal"
          keyboardType="decimal-pad"
          editable={editable}
          accessibilityLabel={accessibilityLabel ?? label}
          // En iOS forzamos multiline+scrollEnabled=false para evitar el bug
          // de placeholder/texto desincronizado del UITextField con Quicksand.
          multiline={Platform.OS === 'ios'}
          scrollEnabled={false}
          submitBehavior={
            Platform.OS === 'ios' ? 'blurAndSubmit' : undefined
          }
          className="font-sans text-base text-foreground"
          textAlignVertical="center"
          style={MONEY_INPUT_STYLE}
          {...rest}
        />
      </InputShell>
    )
  },
)

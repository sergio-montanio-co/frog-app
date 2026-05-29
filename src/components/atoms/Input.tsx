import { forwardRef, useState } from 'react'
import {
  Platform,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native'
import type { IconName } from './Icon'
import { InputShell } from './InputShell'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

// iOS UITextField (single-line) rendiza placeholder vs texto editado con
// baselines distintos cuando la font es custom → "salto" del caret al teclear.
// Workaround estándar: forzar multiline=true (que usa UITextView por dentro,
// rendiza consistente) + scrollEnabled=false + submitBehavior="blurAndSubmit"
// → se comporta visualmente como single-line, pero sin el bug.
// Android: necesita quitar el font padding del sistema explícitamente.
const ANDROID_TEXT_STYLE: TextStyle = {
  padding: 0,
  margin: 0,
  includeFontPadding: false,
}

// UITextView (multiline) tiene un textContainerInset default de (8, 0, 8, 0)
// que en RN se mapea a paddingTop/paddingBottom: 8 dentro del TextInput. Eso es
// lo que empuja el texto hacia abajo del icono. Lo anulamos explícitamente.
const IOS_SINGLE_LINE_STYLE: TextStyle = {
  height: 24,
  paddingTop: 0,
  paddingBottom: 0,
}

const INPUT_STYLE: Record<'singleLine' | 'multiline', StyleProp<TextStyle>> = {
  singleLine: Platform.select({
    ios: IOS_SINGLE_LINE_STYLE,
    android: ANDROID_TEXT_STYLE,
    default: null,
  }),
  multiline: Platform.select({
    ios: null,
    android: ANDROID_TEXT_STYLE,
    default: null,
  }),
}

export type InputProps = TextInputProps & {
  label?: string
  error?: string
  helperText?: string
  leadingIcon?: IconName
  trailingIcon?: IconName
  onTrailingIconPress?: () => void
  trailingAccessibilityLabel?: string
  className?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leadingIcon,
    trailingIcon,
    onTrailingIconPress,
    trailingAccessibilityLabel,
    className,
    accessibilityLabel,
    onFocus,
    onBlur,
    editable = true,
    multiline,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false)
  const isMultiline = multiline === true
  // En iOS forzamos multiline=true internamente para evitar el bug de
  // placeholder/texto desincronizado del UITextField con fonts custom.
  // El comportamiento visual sigue siendo single-line.
  const useIosFakeSingleLine = Platform.OS === 'ios' && !isMultiline

  return (
    <InputShell
      label={label}
      helperText={helperText}
      error={error}
      focused={focused}
      disabled={!editable}
      multiline={isMultiline}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      onTrailingIconPress={onTrailingIconPress}
      trailingAccessibilityLabel={trailingAccessibilityLabel}
      className={className}
    >
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        accessibilityLabel={accessibilityLabel ?? label}
        editable={editable}
        multiline={isMultiline || useIosFakeSingleLine}
        scrollEnabled={isMultiline}
        submitBehavior={useIosFakeSingleLine ? 'blurAndSubmit' : undefined}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        className={cn(
          'font-sans text-base text-foreground',
          isMultiline && 'min-h-8',
        )}
        textAlignVertical={isMultiline ? 'top' : 'center'}
        style={INPUT_STYLE[isMultiline ? 'multiline' : 'singleLine']}
        {...rest}
      />
    </InputShell>
  )
})

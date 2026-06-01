import { useRef, useState } from 'react'
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  IconButton,
  Input,
  MarkdownText,
  Text,
  hasMarkdownMarkers,
  type InputProps,
} from '@/components/atoms'

export type MarkdownTextareaProps = Omit<
  InputProps,
  'multiline' | 'numberOfLines' | 'onSelectionChange'
> & {
  numberOfLines?: number
}

type Selection = { start: number; end: number }

export function MarkdownTextarea({
  value = '',
  onChangeText,
  numberOfLines = 4,
  ...rest
}: MarkdownTextareaProps) {
  const { t } = useTranslation()
  const inputRef = useRef<TextInput>(null)
  const selectionRef = useRef<Selection>({
    start: value.length,
    end: value.length,
  })
  // Cursor controlado solo durante el "tick" posterior a insertar markdown;
  // si lo dejamos siempre controlado el teclado se siente lento.
  const [pendingSelection, setPendingSelection] = useState<
    Selection | undefined
  >(undefined)

  function handleSelectionChange(
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) {
    selectionRef.current = e.nativeEvent.selection
  }

  function insertWrap(prefix: string, suffix: string) {
    const { start, end } = selectionRef.current
    const safeStart = Math.min(start, value.length)
    const safeEnd = Math.min(end, value.length)
    const selected = value.slice(safeStart, safeEnd)
    const next =
      value.slice(0, safeStart) +
      prefix +
      selected +
      suffix +
      value.slice(safeEnd)
    const newCursor = selected
      ? safeStart + prefix.length + selected.length + suffix.length
      : safeStart + prefix.length
    applyChange(next, newCursor)
  }

  function insertLinePrefix(prefix: string) {
    const { start } = selectionRef.current
    const safeStart = Math.min(start, value.length)
    const lineStart = value.lastIndexOf('\n', safeStart - 1) + 1
    const alreadyHasPrefix = value.slice(lineStart, lineStart + prefix.length) === prefix
    if (alreadyHasPrefix) {
      applyChange(value, safeStart)
      return
    }
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    const newCursor = safeStart + prefix.length
    applyChange(next, newCursor)
  }

  function applyChange(next: string, cursor: number) {
    onChangeText?.(next)
    selectionRef.current = { start: cursor, end: cursor }
    setPendingSelection({ start: cursor, end: cursor })
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      setPendingSelection(undefined)
    })
  }

  return (
    <View className="gap-2">
      <Input
        {...rest}
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        selection={pendingSelection}
        multiline
        numberOfLines={numberOfLines}
      />
      <View className="flex-row gap-2">
        <IconButton
          name="format-bold"
          variant="secondary"
          accessibilityLabel={t('markdown.bold')}
          onPress={() => insertWrap('**', '**')}
        />
        <IconButton
          name="format-italic"
          variant="secondary"
          accessibilityLabel={t('markdown.italic')}
          onPress={() => insertWrap('_', '_')}
        />
        <IconButton
          name="format-list-bulleted"
          variant="secondary"
          accessibilityLabel={t('markdown.bullet')}
          onPress={() => insertLinePrefix('- ')}
        />
      </View>
      {hasMarkdownMarkers(value) ? (
        <View className="gap-1 rounded-card border-hairline border-muted bg-foreground/[0.03] p-3">
          <Text variant="caption" tone="secondary">
            {t('markdown.preview')}
          </Text>
          <MarkdownText value={value} />
        </View>
      ) : null}
    </View>
  )
}

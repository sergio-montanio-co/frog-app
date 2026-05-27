import { useRef, useState } from 'react'
import { View } from 'react-native'
import * as Clipboard from 'expo-clipboard'

import { Icon } from './Icon'
import { IconButton } from './IconButton'
import { Text } from './Text'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

export type CopyableFieldProps = {
  label: string
  value: string
  copyLabel: string
  monospace?: boolean
  className?: string
}

export function CopyableField({
  label,
  value,
  copyLabel,
  monospace,
  className,
}: CopyableFieldProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function copy() {
    await Clipboard.setStringAsync(value)
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <View className={cn('gap-1', className)}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Text
            variant="body-em"
            className={cn(monospace && 'tracking-wider')}
            selectable
          >
            {value}
          </Text>
        </View>
        {copied ? (
          <View className="h-11 w-11 items-center justify-center">
            <Icon name="check" size={20} color={colors.primary} />
          </View>
        ) : (
          <IconButton
            name="content-copy"
            variant="ghost"
            accessibilityLabel={copyLabel}
            onPress={copy}
          />
        )}
      </View>
    </View>
  )
}

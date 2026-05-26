import { Image, View } from 'react-native'
import { Text } from './Text'
import { cn } from '@/lib/cn'

export type AvatarSize = 32 | 40 | 56 | 80

const sizeClass: Record<AvatarSize, string> = {
  32: 'w-8 h-8',
  40: 'w-10 h-10',
  56: 'w-14 h-14',
  80: 'w-20 h-20',
}

const textVariant: Record<AvatarSize, 'caption' | 'body-em' | 'title' | 'display'> = {
  32: 'caption',
  40: 'body-em',
  56: 'title',
  80: 'display',
}

export type AvatarProps = {
  uri?: string | null
  name?: string | null
  size?: AvatarSize
  className?: string
  accessibilityLabel?: string
}

export function Avatar({
  uri,
  name,
  size = 40,
  className,
  accessibilityLabel,
}: AvatarProps) {
  const trimmed = name?.trim() ?? ''
  const initial = (trimmed[0] ?? '?').toUpperCase()
  const label = accessibilityLabel ?? trimmed

  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={label || undefined}
        accessible={!!label}
        className={cn(sizeClass[size], 'rounded-full bg-muted', className)}
      />
    )
  }

  return (
    <View
      accessibilityLabel={label || undefined}
      accessible={!!label}
      className={cn(
        sizeClass[size],
        'rounded-full bg-primary items-center justify-center',
        className,
      )}
    >
      <Text variant={textVariant[size]} tone="background">
        {initial}
      </Text>
    </View>
  )
}

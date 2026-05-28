import { View } from 'react-native'

import { Button } from './Button'
import { Card } from './Card'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

export type ErrorStateProps = {
  title: string
  body?: string
  retryLabel?: string
  onRetry?: () => void
  icon?: IconName
  className?: string
}

export function ErrorState({
  title,
  body,
  retryLabel,
  onRetry,
  icon = 'error-outline',
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('items-center gap-4', className)}>
      <Icon name={icon} size={32} color={colors.secondary} />
      <View className="items-center gap-1">
        <Text variant="title" className="text-center">
          {title}
        </Text>
        {body ? (
          <Text variant="body" tone="secondary" className="text-center">
            {body}
          </Text>
        ) : null}
      </View>
      {onRetry && retryLabel ? (
        <Button
          label={retryLabel}
          variant="secondary"
          onPress={onRetry}
          className="self-stretch"
        />
      ) : null}
    </Card>
  )
}

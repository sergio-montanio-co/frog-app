import { View } from 'react-native'

import { Button } from './Button'
import { Card } from './Card'
import { Icon, type IconName } from './Icon'
import { Text } from './Text'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

export type EmptyStateProps = {
  icon?: IconName
  title: string
  body?: string
  cta?: {
    label: string
    onPress: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  body,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('items-center gap-4', className)}>
      {icon ? <Icon name={icon} size={32} color={colors.secondary} /> : null}
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
      {cta ? (
        <Button
          label={cta.label}
          variant="secondary"
          onPress={cta.onPress}
          className="self-stretch"
        />
      ) : null}
    </Card>
  )
}

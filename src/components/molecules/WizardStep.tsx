import { View, type ViewProps } from 'react-native'
import { Text } from '@/components/atoms'
import { cn } from '@/lib/cn'

export type WizardStepProps = ViewProps & {
  title: string
  subtitle?: string
  className?: string
}

export function WizardStep({
  title,
  subtitle,
  className,
  children,
  ...rest
}: WizardStepProps) {
  return (
    <View className={cn('gap-5', className)} {...rest}>
      <View className="gap-2">
        <Text variant="display">{title}</Text>
        {subtitle ? (
          <Text variant="body" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="gap-4">{children}</View>
    </View>
  )
}

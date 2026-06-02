import { useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Icon, Text, type IconName } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { colors } from '@/theme/colors'

export type SpeedDialAction = {
  key: string
  label: string
  icon: IconName
  onPress: () => void
}

export type SpeedDialFabProps = {
  actions: SpeedDialAction[]
  openLabel: string
  closeLabel: string
  className?: string
}

export function SpeedDialFab({
  actions,
  openLabel,
  closeLabel,
  className,
}: SpeedDialFabProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <View
      pointerEvents="box-none"
      className={cn('absolute inset-0', className)}
    >
      {open ? (
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          className="absolute inset-0 bg-foreground/30"
        />
      ) : null}

      <View
        pointerEvents="box-none"
        className="absolute bottom-6 right-4 items-end gap-3"
      >
        {open
          ? actions.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => {
                  close()
                  action.onPress()
                }}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                className="h-12 flex-row items-center gap-3 rounded-full border-hairline border-muted bg-background pl-5 pr-2"
              >
                <Text variant="body-em">{action.label}</Text>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Icon
                    name={action.icon}
                    size={20}
                    color={colors.background}
                  />
                </View>
              </Pressable>
            ))
          : null}

        <Pressable
          onPress={() => setOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={open ? closeLabel : openLabel}
          accessibilityState={{ expanded: open }}
          className="h-14 w-14 items-center justify-center rounded-full bg-primary"
        >
          <Icon
            name={open ? 'close' : 'add'}
            size={24}
            color={colors.background}
          />
        </Pressable>
      </View>
    </View>
  )
}

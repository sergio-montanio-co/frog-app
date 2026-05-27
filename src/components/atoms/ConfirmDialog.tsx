import { Modal, View } from 'react-native'

import { Button } from './Button'
import { Icon } from './Icon'
import { Text } from './Text'
import { colors } from '@/theme/colors'

export type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
  confirmLoading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive,
  confirmLoading,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-foreground/40 px-6">
        <View className="w-full max-w-md gap-4 rounded-card border-hairline border-muted bg-background p-5">
          <View className="flex-row items-center gap-2">
            {destructive ? (
              <Icon name="warning" size={20} color={colors.primary} />
            ) : null}
            <Text variant="title" className="flex-1">
              {title}
            </Text>
          </View>
          {description ? (
            <Text variant="body" tone="secondary">
              {description}
            </Text>
          ) : null}
          <View className="gap-2 pt-2">
            <Button
              label={confirmLabel}
              variant="primary"
              onPress={onConfirm}
              loading={confirmLoading}
              disabled={confirmLoading}
            />
            <Button
              label={cancelLabel}
              variant="ghost"
              onPress={onCancel}
              disabled={confirmLoading}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

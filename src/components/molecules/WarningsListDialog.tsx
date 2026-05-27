import { Modal, ScrollView, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Button, Icon, Text } from '@/components/atoms'
import { colors } from '@/theme/colors'

export type WarningsListDialogProps = {
  open: boolean
  warnings: string[]
  onClose: () => void
}

export function WarningsListDialog({
  open,
  warnings,
  onClose,
}: WarningsListDialogProps) {
  const { t } = useTranslation()
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-foreground/40 px-6">
        <View className="w-full max-w-md gap-4 rounded-card border-hairline border-muted bg-background p-5">
          <View className="flex-row items-center gap-2">
            <Icon name="info-outline" size={20} color={colors.primary} />
            <Text variant="title" className="flex-1">
              {t('trips.admin.release.warningsTitle')}
            </Text>
          </View>
          <Text variant="body" tone="secondary">
            {t('trips.admin.release.warningsSubtitle')}
          </Text>
          <ScrollView className="max-h-72">
            <View className="gap-2">
              {warnings.map((w, i) => (
                <View
                  key={i}
                  className="flex-row items-start gap-2 rounded-card border-hairline border-muted p-3"
                >
                  <Icon
                    name="error-outline"
                    size={20}
                    color={colors.secondary}
                  />
                  <Text variant="body" className="flex-1">
                    {w}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <Button
            label={t('common.understood')}
            variant="primary"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  )
}

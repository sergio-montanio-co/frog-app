import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { CopyableField, Icon, Text } from '@/components/atoms'
import { colors } from '@/theme/colors'
import { cn } from '@/lib/cn'
import type { ResponsibleAccount } from '@/lib/api/queries'

export type BankAccountInfoProps = {
  account: ResponsibleAccount | null
  className?: string
}

export function BankAccountInfo({ account, className }: BankAccountInfoProps) {
  const { t } = useTranslation()

  if (!account) {
    return (
      <View
        className={cn(
          'flex-row items-start gap-2 rounded-card border-hairline border-muted p-4',
          className,
        )}
      >
        <Icon name="info-outline" size={20} color={colors.secondary} />
        <Text variant="body" tone="secondary" className="flex-1">
          {t('trips.contributions.new.account.empty')}
        </Text>
      </View>
    )
  }

  return (
    <View
      className={cn(
        'gap-3 rounded-card border-hairline border-muted p-4',
        className,
      )}
    >
      <View className="gap-1">
        <Text variant="caption" tone="secondary">
          {t('trips.contributions.new.account.holder')}
        </Text>
        <Text variant="body-em" selectable>
          {account.holderName}
        </Text>
      </View>
      <View className="gap-1">
        <Text variant="caption" tone="secondary">
          {t('trips.contributions.new.account.bank')}
        </Text>
        <Text variant="body-em" selectable>
          {account.bank}
        </Text>
      </View>
      <CopyableField
        label={t('trips.contributions.new.account.clabe')}
        value={account.clabe}
        copyLabel={t('common.copy')}
        monospace
      />
      {account.instructions ? (
        <View className="gap-1">
          <Text variant="caption" tone="secondary">
            {t('trips.contributions.new.account.instructions')}
          </Text>
          <Text variant="body" tone="secondary">
            {account.instructions}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

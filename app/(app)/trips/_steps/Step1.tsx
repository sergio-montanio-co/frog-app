import { Switch, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Input, Text } from '@/components/atoms'
import { WizardStep } from '@/components/molecules'
import { colors } from '@/theme/colors'

import type { DraftTrip } from '../_wizard'

export type StepProps = {
  draft: DraftTrip
  onChange: (next: DraftTrip) => void
}

export function Step1({ draft, onChange }: StepProps) {
  const { t } = useTranslation()
  return (
    <WizardStep
      title={t('trips.new.step1.title')}
      subtitle={t('trips.new.step1.subtitle')}
    >
      <Input
        label={t('trips.new.step1.nameLabel')}
        placeholder={t('trips.new.step1.namePlaceholder')}
        value={draft.name}
        onChangeText={(name) => onChange({ ...draft, name })}
        autoCapitalize="sentences"
        maxLength={100}
      />
      <Input
        label={t('trips.new.step1.destinationLabel')}
        placeholder={t('trips.new.step1.destinationPlaceholder')}
        value={draft.destination}
        onChangeText={(destination) => onChange({ ...draft, destination })}
        autoCapitalize="sentences"
        maxLength={200}
      />
      <Input
        label={t('trips.new.step1.cityLabel')}
        placeholder={t('trips.new.step1.cityPlaceholder')}
        value={draft.destinationCity ?? ''}
        onChangeText={(destinationCity) =>
          onChange({ ...draft, destinationCity: destinationCity || undefined })
        }
        autoCapitalize="sentences"
        maxLength={120}
      />
      <Input
        label={t('trips.new.step1.countryLabel')}
        placeholder={t('trips.new.step1.countryPlaceholder')}
        value={draft.destinationCountry ?? ''}
        onChangeText={(raw) => {
          const code = raw.toUpperCase().slice(0, 2)
          onChange({
            ...draft,
            destinationCountry: code || undefined,
          })
        }}
        autoCapitalize="characters"
        maxLength={2}
      />
      <Input
        label={t('trips.new.step1.descriptionLabel')}
        placeholder={t('trips.new.step1.descriptionPlaceholder')}
        value={draft.description ?? ''}
        onChangeText={(description) =>
          onChange({ ...draft, description: description || undefined })
        }
        multiline
        numberOfLines={3}
        maxLength={2000}
        className="h-24 pt-3"
      />
      <View className="flex-row items-start gap-3 rounded-card border-hairline border-muted p-4">
        <View className="flex-1 gap-1">
          <Text variant="body-em">{t('trips.new.step1.soloLabel')}</Text>
          <Text variant="caption" tone="secondary">
            {t('trips.new.step1.soloHelp')}
          </Text>
        </View>
        <Switch
          value={draft.isSolo}
          onValueChange={(isSolo) => onChange({ ...draft, isSolo })}
          trackColor={{ false: colors.muted, true: colors.primary }}
          thumbColor={colors.background}
          accessibilityLabel={t('trips.new.step1.soloLabel')}
        />
      </View>
    </WizardStep>
  )
}

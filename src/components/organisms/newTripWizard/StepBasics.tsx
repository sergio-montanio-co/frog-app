import { Switch, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Input, Text } from '@/components/atoms'
import {
  DestinationPicker,
  MarkdownTextarea,
  WizardStep,
} from '@/components/molecules'
import { colors } from '@/theme/colors'

import type { DraftTrip } from '@/lib/trips/wizard'

export type StepProps = {
  draft: DraftTrip
  onChange: (next: DraftTrip) => void
}

export function StepBasics({ draft, onChange }: StepProps) {
  const { t } = useTranslation()
  return (
    <WizardStep
      title={t('trips.new.step1.title')}
      subtitle={t('trips.new.step1.subtitle')}
    >
      <Input
        testID="wizard-trip-name-input"
        label={t('trips.new.step1.nameLabel')}
        placeholder={t('trips.new.step1.namePlaceholder')}
        value={draft.name}
        onChangeText={(name) => onChange({ ...draft, name })}
        autoCapitalize="sentences"
        maxLength={100}
      />
      <DestinationPicker
        value={{
          destination: draft.destination,
          destinationCity: draft.destinationCity,
          destinationCountry: draft.destinationCountry,
          placeId: draft.placeId,
        }}
        onChange={(next) =>
          onChange({
            ...draft,
            destination: next.destination,
            destinationCity: next.destinationCity,
            destinationCountry: next.destinationCountry,
            placeId: next.placeId,
          })
        }
        onPlaceSelected={(place) => {
          if (!draft.name.trim()) {
            onChange({
              ...draft,
              name: place.name,
              destination: place.name,
              destinationCity: place.city ?? undefined,
              destinationCountry: place.countryIso2 ?? undefined,
              placeId: place.mapboxId,
            })
          }
        }}
      />
      <MarkdownTextarea
        label={t('trips.new.step1.descriptionLabel')}
        placeholder={t('trips.new.step1.descriptionPlaceholder')}
        value={draft.description ?? ''}
        onChangeText={(description) =>
          onChange({ ...draft, description: description || undefined })
        }
        numberOfLines={3}
        maxLength={2000}
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

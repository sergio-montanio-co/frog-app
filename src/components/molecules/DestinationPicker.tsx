import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Icon, Input, Text } from '@/components/atoms'
import { PlaceAutocomplete } from './PlaceAutocomplete'
import { isPlacesEnabled, type PlaceDetails } from '@/lib/places/mapbox'
import { colors } from '@/theme/colors'

export type DestinationValue = {
  destination: string
  destinationCity?: string
  destinationCountry?: string
  placeId?: string
}

export type DestinationPickerProps = {
  value: DestinationValue
  onChange: (next: DestinationValue) => void
  onPlaceSelected?: (place: PlaceDetails) => void
  countryCode?: string
  destinationLabel?: string
  cityLabel?: string
  countryLabel?: string
}

function initialMode(value: DestinationValue): 'auto' | 'manual' {
  if (!isPlacesEnabled()) return 'manual'
  if (value.destination && !value.placeId) return 'manual'
  return 'auto'
}

export function DestinationPicker({
  value,
  onChange,
  onPlaceSelected,
  countryCode,
  destinationLabel,
  cityLabel,
  countryLabel,
}: DestinationPickerProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'auto' | 'manual'>(() => initialMode(value))
  const [autoText, setAutoText] = useState(value.destination ?? '')
  // Dirección completa del último lugar resuelto. Solo se usa para
  // mostrarla en la card de confirmación — no se persiste en el draft
  // porque "destination" guarda el nombre del lugar, no la dirección.
  const [confirmedAddress, setConfirmedAddress] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (mode === 'auto') setAutoText(value.destination ?? '')
  }, [value.destination, mode])

  function applyPlace(place: PlaceDetails) {
    onChange({
      destination: place.name,
      destinationCity: place.city ?? undefined,
      destinationCountry: place.countryIso2 ?? undefined,
      placeId: place.mapboxId,
    })
    setAutoText(place.name)
    setConfirmedAddress(place.formattedAddress)
    onPlaceSelected?.(place)
  }

  const placesAvailable = isPlacesEnabled()
  const showAutoToggle = placesAvailable && mode === 'manual'

  return (
    <View className="gap-3">
      {mode === 'auto' && placesAvailable ? (
        <PlaceAutocomplete
          label={destinationLabel ?? t('trips.new.step1.destinationLabel')}
          placeholder={t('trips.new.step1.destinationPlaceholderAuto')}
          value={autoText}
          onChangeText={(next) => {
            setAutoText(next)
            if (value.placeId) {
              onChange({
                ...value,
                destination: next,
                placeId: undefined,
              })
            } else {
              onChange({ ...value, destination: next })
            }
          }}
          onPlaceSelected={applyPlace}
          onFallback={() => setMode('manual')}
          helperText={
            value.placeId
              ? undefined
              : t('trips.new.step1.destinationHelpAuto')
          }
          countryCode={countryCode}
        />
      ) : (
        <View className="gap-4">
          <Input
            label={destinationLabel ?? t('trips.new.step1.destinationLabel')}
            placeholder={t('trips.new.step1.destinationPlaceholderManual')}
            value={value.destination}
            onChangeText={(destination) =>
              onChange({
                ...value,
                destination,
                placeId: undefined,
              })
            }
            leadingIcon="place"
            maxLength={200}
            autoCapitalize="sentences"
          />
          <Input
            label={cityLabel ?? t('trips.new.step1.cityLabel')}
            placeholder={t('trips.new.step1.cityPlaceholder')}
            value={value.destinationCity ?? ''}
            onChangeText={(city) =>
              onChange({
                ...value,
                destinationCity: city || undefined,
              })
            }
            maxLength={120}
            autoCapitalize="sentences"
          />
          <Input
            label={countryLabel ?? t('trips.new.step1.countryLabel')}
            placeholder={t('trips.new.step1.countryPlaceholder')}
            value={value.destinationCountry ?? ''}
            onChangeText={(raw) =>
              onChange({
                ...value,
                destinationCountry:
                  raw.toUpperCase().slice(0, 2) || undefined,
              })
            }
            autoCapitalize="characters"
            maxLength={2}
          />
          {showAutoToggle ? (
            <Pressable
              onPress={() => {
                setAutoText('')
                setMode('auto')
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('trips.new.step1.backToAuto')}
              className="flex-row items-center gap-2 py-2"
            >
              <Icon name="search" size={20} color={colors.primary} />
              <Text variant="body-em" tone="primary">
                {t('trips.new.step1.backToAuto')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {mode === 'auto' && value.placeId ? (
        <View className="flex-row items-start gap-3 rounded-card bg-foreground/[0.03] p-3">
          <Icon name="check-circle" size={20} color={colors.primary} />
          <View className="flex-1 gap-0.5">
            <Text variant="caption" tone="secondary">
              {t('trips.new.step1.selectedPlace')}
            </Text>
            <Text variant="body-em" numberOfLines={2}>
              {value.destination}
            </Text>
            {confirmedAddress ? (
              <Text variant="caption" tone="secondary" numberOfLines={2}>
                {confirmedAddress}
              </Text>
            ) : value.destinationCity || value.destinationCountry ? (
              <Text variant="caption" tone="secondary">
                {[value.destinationCity, value.destinationCountry]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  )
}

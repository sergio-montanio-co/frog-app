import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Icon, Input, Text } from '@/components/atoms'
import { cn } from '@/lib/cn'
import {
  type PlaceDetails,
  type PlacePrediction,
  getPlaceDetails,
  newSessionToken,
  searchPlaces,
} from '@/lib/places/mapbox'
import { colors } from '@/theme/colors'

export type PlaceAutocompleteProps = {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (next: string) => void
  onPlaceSelected: (place: PlaceDetails) => void
  onFallback: () => void
  error?: string
  helperText?: string
  countryCode?: string
}

const DEBOUNCE_MS = 350

export function PlaceAutocomplete({
  label,
  placeholder,
  value,
  onChangeText,
  onPlaceSelected,
  onFallback,
  error,
  helperText,
  countryCode,
}: PlaceAutocompleteProps) {
  const { t } = useTranslation()
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const sessionTokenRef = useRef<string>(newSessionToken())
  const abortRef = useRef<AbortController | null>(null)
  // El value cambia al formattedAddress después de seleccionar; sin esto el
  // useEffect dispararía una nueva búsqueda y reabriría el dropdown.
  const skipNextSearchRef = useRef(false)

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }
    if (value.trim().length < 3) {
      setPredictions([])
      return
    }
    const handle = setTimeout(() => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      searchPlaces(value, sessionTokenRef.current, {
        signal: ctrl.signal,
        country: countryCode,
      })
        .then((next) => setPredictions(next))
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === 'AbortError') return
          console.warn('[places] suggest error', err)
          setPredictions([])
        })
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [value, countryCode])

  async function handleSelect(p: PlacePrediction) {
    try {
      setLoading(true)
      abortRef.current?.abort()
      const details = await getPlaceDetails(
        p.mapboxId,
        sessionTokenRef.current,
      )
      sessionTokenRef.current = newSessionToken()
      skipNextSearchRef.current = true
      setPredictions([])
      setFocused(false)
      onPlaceSelected(details)
    } catch (err) {
      console.warn('[places] retrieve error', err)
    } finally {
      setLoading(false)
    }
  }

  const showDropdown = focused && (predictions.length > 0 || loading)

  return (
    <View className="gap-2">
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => setFocused(false), 150)
        }}
        leadingIcon="search"
        trailingIcon={value.length > 0 && !loading ? 'close' : undefined}
        onTrailingIconPress={() => onChangeText('')}
        trailingAccessibilityLabel={t('places.clear')}
        error={error}
        helperText={helperText}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {showDropdown ? (
        <View className="rounded-card border-hairline border-muted bg-background">
          {loading ? (
            <View className="flex-row items-center gap-2 p-3">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text variant="caption" tone="secondary">
                {t('places.searching')}
              </Text>
            </View>
          ) : null}

          {!loading
            ? predictions.map((p, i) => {
                const isLodging = p.poiCategory.some((c) =>
                  /hotel|lodging/i.test(c),
                )
                return (
                  <Pressable
                    key={p.mapboxId}
                    onPress={() => handleSelect(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.name}, ${p.placeFormatted}`}
                    className={cn(
                      'flex-row items-start gap-3 p-3',
                      i > 0 && 'border-t-hairline border-muted',
                    )}
                  >
                    <Icon
                      name={isLodging ? 'hotel' : 'place'}
                      size={20}
                      color={colors.secondary}
                    />
                    <View className="flex-1">
                      <Text variant="body-em" numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text
                        variant="caption"
                        tone="secondary"
                        numberOfLines={1}
                      >
                        {p.placeFormatted}
                      </Text>
                    </View>
                  </Pressable>
                )
              })
            : null}

          {!loading ? (
            <Pressable
              onPress={onFallback}
              accessibilityRole="button"
              className={cn(
                'flex-row items-center gap-3 p-3',
                predictions.length > 0 && 'border-t-hairline border-muted',
              )}
            >
              <Icon
                name="edit-location"
                size={20}
                color={colors.primary}
              />
              <Text variant="body-em" tone="primary">
                {t('places.notFound')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

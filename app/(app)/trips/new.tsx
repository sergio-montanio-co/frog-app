import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import {
  Button,
  IconButton,
  Stepper,
} from '@/components/atoms'
import { useCreateTrip } from '@/lib/api/queries'
import { parseBackendError } from '@/lib/api/errors'

import {
  Step1,
  Step2,
  Step3,
  Step4,
  Step5,
} from './_steps'
import {
  buildPayloadFromDraft,
  displayedStep,
  emptyDraft,
  isStepValid,
  nextStep,
  prevStep,
  totalDots,
  type DraftTrip,
  type Step,
} from './_wizard'

function hasUserData(draft: DraftTrip): boolean {
  return Boolean(
    draft.name.trim() ||
      draft.destination.trim() ||
      draft.purchaseDeadline ||
      draft.estimatedCostPerPerson ||
      draft.members.length > 0,
  )
}

export default function NewTripScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const create = useCreateTrip()

  const [step, setStep] = useState<Step>(1)
  const [draft, setDraft] = useState<DraftTrip>(emptyDraft())
  const [submitError, setSubmitError] = useState<string | null>(null)

  const stepIsValid = isStepValid(step, draft)
  const isLastStep = step === 5
  const isPending = create.isPending

  function handleBack() {
    if (step !== 1) {
      setStep(prevStep(step, draft))
      return
    }
    if (!hasUserData(draft)) {
      router.back()
      return
    }
    Alert.alert(t('trips.new.exitTitle'), t('trips.new.exitMessage'), [
      { text: t('trips.new.exitKeep'), style: 'cancel' },
      {
        text: t('trips.new.exitDiscard'),
        style: 'destructive',
        onPress: () => router.back(),
      },
    ])
  }

  async function handlePrimary() {
    if (!isLastStep) {
      setStep(nextStep(step, draft))
      return
    }
    setSubmitError(null)
    try {
      const trip = await create.mutateAsync(buildPayloadFromDraft(draft))
      router.replace({
        pathname: '/trips/[id]/invitations-created',
        params: { id: trip.id },
      })
    } catch (err) {
      setSubmitError(parseBackendError(err))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <IconButton
            name="arrow-back"
            variant="ghost"
            accessibilityLabel={t('common.back')}
            onPress={handleBack}
          />
          <Stepper
            current={displayedStep(step, draft)}
            total={totalDots(draft)}
            accessibilityLabel={t('trips.new.stepIndicator', {
              current: displayedStep(step, draft),
              total: totalDots(draft),
            })}
          />
          <View className="w-11" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? <Step1 draft={draft} onChange={setDraft} /> : null}
          {step === 2 ? <Step2 draft={draft} onChange={setDraft} /> : null}
          {step === 3 ? <Step3 draft={draft} onChange={setDraft} /> : null}
          {step === 4 ? <Step4 draft={draft} onChange={setDraft} /> : null}
          {step === 5 ? (
            <Step5
              draft={draft}
              onChange={setDraft}
              submitError={submitError}
            />
          ) : null}
        </ScrollView>

        <View className="border-t-hairline border-muted bg-background p-4">
          <Button
            label={
              isLastStep ? t('trips.new.create') : t('trips.new.next')
            }
            onPress={handlePrimary}
            disabled={!stepIsValid || isPending}
            loading={isPending}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

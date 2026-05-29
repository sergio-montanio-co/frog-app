import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'

import { ConfirmDialog } from '@/components/atoms'
import { WarningsListDialog } from './WarningsListDialog'
import { parseBackendError } from '@/lib/api/errors'
import { useCancelSavingsPlan } from '@/lib/api/queries'
import type { TripDto, TripSavingsPlan } from '@/lib/api/queries'
import { isOnlyActivePlan } from '@/lib/trips/helpers'

export type CancelPlanDialogProps = {
  open: boolean
  trip: TripDto
  plan: TripSavingsPlan
  onClose: () => void
  onCancelled?: () => void
}

export function CancelPlanDialog({
  open,
  trip,
  plan,
  onClose,
  onCancelled,
}: CancelPlanDialogProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const cancel = useCancelSavingsPlan(trip.id)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[] | null>(null)
  const onlyPlan = isOnlyActivePlan(plan, trip)

  async function onConfirm() {
    setError(null)
    try {
      const result = await cancel.mutateAsync(plan.id)
      onCancelled?.()
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings)
      } else {
        onClose()
      }
    } catch (err) {
      setError(parseBackendError(err))
    }
  }

  function onCancel() {
    setError(null)
    onClose()
  }

  if (warnings) {
    return (
      <WarningsListDialog
        open
        warnings={warnings}
        title={t('trips.admin.cancelTrip.warningsTitle')}
        onClose={() => {
          setWarnings(null)
          onClose()
          router.replace('/(app)/(tabs)/')
        }}
      />
    )
  }

  return (
    <ConfirmDialog
      open={open}
      destructive
      title={
        onlyPlan
          ? t('trips.admin.cancelTrip.title')
          : t('trips.admin.cancelPlan.title')
      }
      description={
        error ??
        (onlyPlan
          ? t('trips.admin.cancelTrip.body', { tripName: trip.name })
          : t('trips.admin.cancelPlan.body'))
      }
      confirmLabel={
        onlyPlan
          ? t('trips.admin.cancelTrip.confirm')
          : t('trips.admin.cancelPlan.confirm')
      }
      cancelLabel={t('common.back')}
      confirmLoading={cancel.isPending}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

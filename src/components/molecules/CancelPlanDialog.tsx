import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/atoms'
import { parseBackendError } from '@/lib/api/errors'
import { useCancelSavingsPlan } from '@/lib/api/queries'

export type CancelPlanDialogProps = {
  open: boolean
  tripId: string
  planId: string
  onClose: () => void
  onCancelled?: () => void
}

export function CancelPlanDialog({
  open,
  tripId,
  planId,
  onClose,
  onCancelled,
}: CancelPlanDialogProps) {
  const { t } = useTranslation()
  const cancel = useCancelSavingsPlan(tripId)
  const [error, setError] = useState<string | null>(null)

  async function onConfirm() {
    setError(null)
    try {
      await cancel.mutateAsync(planId)
      onCancelled?.()
      onClose()
    } catch (err) {
      setError(parseBackendError(err))
    }
  }

  function onCancel() {
    setError(null)
    onClose()
  }

  return (
    <ConfirmDialog
      open={open}
      destructive
      title={t('trips.admin.cancelPlan.title')}
      description={error ?? t('trips.admin.cancelPlan.body')}
      confirmLabel={t('trips.admin.cancelPlan.confirm')}
      cancelLabel={t('common.back')}
      confirmLoading={cancel.isPending}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

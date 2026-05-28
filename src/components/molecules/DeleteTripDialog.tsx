import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/atoms'
import { parseBackendError } from '@/lib/api/errors'
import { useDeleteTrip } from '@/lib/api/queries'

export type DeleteTripDialogProps = {
  open: boolean
  tripId: string
  tripName: string
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteTripDialog({
  open,
  tripId,
  tripName,
  onClose,
  onDeleted,
}: DeleteTripDialogProps) {
  const { t } = useTranslation()
  const del = useDeleteTrip()
  const [error, setError] = useState<string | null>(null)

  async function onConfirm() {
    setError(null)
    try {
      await del.mutateAsync(tripId)
      onDeleted?.()
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
      title={t('trips.admin.deleteTrip.title')}
      description={error ?? t('trips.admin.deleteTrip.body', { tripName })}
      confirmLabel={t('trips.admin.deleteTrip.confirm')}
      cancelLabel={t('common.cancel')}
      confirmLoading={del.isPending}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

import type {
  MemberCuotaStatus,
  PaymentSchedule,
  ResponsibleAccount,
  TripDto,
  TripMember,
  TripSavingsPlan,
} from '@/lib/api/queries'

/**
 * Busca el plan de tipo `trip_purchase` en estado active/paused.
 * Para "el plan actualmente activo del trip" sin importar tipo,
 * usa {@link findActivePlan} (pivotea a viáticos primero).
 */
export function findActivePurchasePlan(
  trip: TripDto,
): TripSavingsPlan | null {
  return (
    trip.savingsPlans.find(
      (p) =>
        p.type === 'trip_purchase' &&
        (p.status === 'active' || p.status === 'paused'),
    ) ?? null
  )
}

export function findActiveViaticosPlan(
  trip: TripDto,
): TripSavingsPlan | null {
  return (
    trip.savingsPlans.find(
      (p) =>
        p.type === 'viaticos' &&
        (p.status === 'active' || p.status === 'paused'),
    ) ?? null
  )
}

export function hasViaticosPlan(trip: TripDto): boolean {
  return trip.savingsPlans.some(
    (p) => p.type === 'viaticos' && p.status !== 'cancelled',
  )
}

/**
 * Plan vivo del trip en orden de prioridad: viáticos activo > trip_purchase activo.
 * Úsalo en dashboard para preguntar "qué plan está corriendo ahora".
 */
export function findActivePlan(trip: TripDto): TripSavingsPlan | null {
  return findActiveViaticosPlan(trip) ?? findActivePurchasePlan(trip)
}

export function resolveMemberName(member: TripMember): string {
  return (
    member.user?.displayName?.trim() ||
    member.invitedName?.trim() ||
    member.invitedEmail?.trim() ||
    member.invitedPhone?.trim() ||
    ''
  )
}

export function isOrganizer(trip: TripDto, userId: string): boolean {
  return trip.members.some(
    (m) =>
      m.role === 'organizer' &&
      m.status === 'active' &&
      m.user?.id === userId,
  )
}

export function daysUntil(iso: string): number {
  const target = new Date(iso).getTime()
  const now = Date.now()
  return Math.ceil((target - now) / 86_400_000)
}

export type MemberStateResult = {
  schedule: PaymentSchedule
  status: MemberCuotaStatus
}

export function getMemberCurrentState(
  memberId: string,
  schedules: PaymentSchedule[],
): MemberStateResult | null {
  for (const s of schedules) {
    const my = s.derivedStatus.perMember.find((p) => p.memberId === memberId)
    if (!my) continue
    if (my.state !== 'paid') return { schedule: s, status: my }
  }
  const last = schedules[schedules.length - 1]
  if (!last) return null
  const lastMine = last.derivedStatus.perMember.find(
    (p) => p.memberId === memberId,
  )
  return lastMine ? { schedule: last, status: lastMine } : null
}

export function todayIsoStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function canReportContribution(plan: TripSavingsPlan | null): boolean {
  if (!plan) return false
  return plan.status === 'active' || plan.status === 'paused'
}

export function canApproveContribution(plan: TripSavingsPlan | null): boolean {
  return canReportContribution(plan)
}

export function canPausePlan(plan: TripSavingsPlan | null): boolean {
  return plan?.status === 'active'
}

export function canResumePlan(plan: TripSavingsPlan | null): boolean {
  return plan?.status === 'paused'
}

export function canReleasePlan(plan: TripSavingsPlan | null): boolean {
  return plan?.status === 'active' || plan?.status === 'paused'
}

export function canCancelPlan(plan: TripSavingsPlan | null): boolean {
  return plan?.status === 'active' || plan?.status === 'paused'
}

export function canDeleteTrip(trip: TripDto): boolean {
  return trip.status === 'draft'
}

export function isOnlyActivePlan(
  plan: TripSavingsPlan,
  trip: TripDto,
): boolean {
  const otherAlive = trip.savingsPlans.filter(
    (p) =>
      p.id !== plan.id &&
      (p.status === 'active' ||
        p.status === 'paused' ||
        p.status === 'released'),
  )
  return otherAlive.length === 0
}

export function canEditTrip(trip: TripDto): boolean {
  return trip.status !== 'cancelled' && trip.status !== 'completed'
}

export function isTripTerminal(trip: TripDto): boolean {
  return trip.status === 'cancelled' || trip.status === 'completed'
}

export function findCancelledPurchasePlan(
  trip: TripDto,
): TripSavingsPlan | null {
  return (
    trip.savingsPlans.find(
      (p) => p.type === 'trip_purchase' && p.status === 'cancelled',
    ) ?? null
  )
}

export function getResponsibleAccount(
  trip: TripDto,
): ResponsibleAccount | null {
  const raw = trip.responsibleAccountInfo
  if (!raw || typeof raw !== 'object') return null
  const holderName = typeof raw.holderName === 'string' ? raw.holderName : ''
  const clabe = typeof raw.clabe === 'string' ? raw.clabe : ''
  const bank = typeof raw.bank === 'string' ? raw.bank : ''
  if (!holderName || !clabe || !bank) return null
  const instructions =
    typeof raw.instructions === 'string' ? raw.instructions : undefined
  return { holderName, clabe, bank, instructions }
}

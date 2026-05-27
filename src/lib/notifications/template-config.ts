import type { IconName } from '@/components/atoms'

export type TemplateTone = 'primary' | 'default' | 'subtle'

export type TemplateConfig = {
  icon: IconName
  tone: TemplateTone
}

export const templateConfig: Record<string, TemplateConfig> = {
  savings_plan_started: { icon: 'savings', tone: 'primary' },
  cuota_recordatorio: { icon: 'event', tone: 'default' },
  cuota_atrasada: { icon: 'schedule', tone: 'subtle' },
  contribution_reported: { icon: 'inbox', tone: 'primary' },
  contribution_confirmed: { icon: 'check-circle', tone: 'primary' },
  contribution_rejected: { icon: 'cancel', tone: 'subtle' },
  cuota_paid: { icon: 'paid', tone: 'primary' },
  plan_target_reached: { icon: 'flag', tone: 'primary' },
  funds_released: { icon: 'payments', tone: 'primary' },
  viaticos_unlocked: { icon: 'restaurant', tone: 'primary' },
  savings_plan_cancelled: { icon: 'block', tone: 'subtle' },
  welcome: { icon: 'waving-hand', tone: 'default' },
  invitation_sent: { icon: 'mail-outline', tone: 'default' },
}

export const fallbackTemplateConfig: TemplateConfig = {
  icon: 'notifications',
  tone: 'default',
}

export function getTemplateConfig(templateKey: string): TemplateConfig {
  return templateConfig[templateKey] ?? fallbackTemplateConfig
}

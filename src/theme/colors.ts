export const colors = {
  primary: '#594731',
  background: '#F2EFEB',
  foreground: '#0D0D0D',
  secondary: '#736A62',
  muted: '#A69C94',
} as const

export type ColorToken = keyof typeof colors

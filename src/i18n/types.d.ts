import 'react-i18next'
import type { TranslationSchema } from './locales/es'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: TranslationSchema
    }
  }
}

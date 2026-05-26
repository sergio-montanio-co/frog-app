import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'
import { es } from './locales/es'
import { en } from './locales/en'

const deviceLanguage = getLocales()[0]?.languageCode ?? 'es'
const initialLanguage = deviceLanguage === 'en' ? 'en' : 'es'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: initialLanguage,
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    returnNull: false,
  })
}

export default i18n

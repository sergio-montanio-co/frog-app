# Localization

## Default Language

The default language is **Spanish (es)**. All user-facing text must be written in Spanish first.

## Supported Languages

| Code | Language |
|------|----------|
| `es` | Español (default) |
| `en` | English |

## How It Works

The app uses `i18next` + `react-i18next` for internationalization and `expo-localization` for detecting the device language.

- Translation files live in `src/i18n/locales/`.
- Each locale has its own file (`es.ts`, `en.ts`) exporting a flat-nested object of translation keys.
- The i18n instance is configured in `src/i18n/index.ts` and imported once in `app/_layout.tsx`.
- If the device language is English, the app uses English translations. Otherwise, it falls back to Spanish.

## Rules

1. **All text in Spanish first.** When adding new user-facing strings, always write the Spanish version in `es.ts` first, then add the English translation in `en.ts`.
2. **Never hardcode strings.** All user-facing text must use `t('key')` from `useTranslation()`.
3. **Keep keys organized.** Group keys by screen or feature (e.g., `onboarding.welcome`, `permissions.title`).
4. **Fallback is Spanish.** If a translation key is missing in any locale, the Spanish value is used.

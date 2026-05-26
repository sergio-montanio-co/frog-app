import type { TranslationSchema } from './es'

export const en: TranslationSchema = {
  common: {
    continue: 'Continue',
    cancel: 'Cancel',
    accept: 'OK',
    back: 'Back',
    loading: 'Loading…',
    retry: 'Retry',
  },
  auth: {
    signIn: {
      title: 'Sign in',
      emailLabel: 'Email',
      emailPlaceholder: 'you@email.com',
      submit: 'Continue',
      codeTitle: 'Enter the code',
      codeSubtitle: 'We sent a code to {{email}}',
      codeLabel: 'Code',
      codeSubmit: 'Verify',
      noAccount: "Don't have an account?",
      goToSignUp: 'Create account',
    },
    signUp: {
      title: 'Create account',
      firstNameLabel: 'First name',
      firstNamePlaceholder: 'Your name',
      emailLabel: 'Email',
      emailPlaceholder: 'you@email.com',
      submit: 'Continue',
      codeTitle: 'Verify your email',
      codeSubtitle: 'We sent a code to {{email}}',
      codeLabel: 'Code',
      codeSubmit: 'Verify',
      hasAccount: 'Already have an account?',
      goToSignIn: 'Sign in',
    },
    errors: {
      invalidEmail: 'The email is not valid.',
      invalidCode: 'The code is not valid.',
      genericStart: "Couldn't start the process. Try again.",
      genericVerify: "Couldn't verify the code. Try again.",
    },
  },
  tabs: {
    trips: 'Trips',
    alerts: 'Alerts',
    profile: 'Profile',
  },
  home: {
    title: 'My trips',
    greeting: 'Hi, {{name}}',
    newTrip: 'New trip',
    placeholder: 'Your trips will show up here.',
  },
  alerts: {
    title: 'Alerts',
    empty: 'No alerts for now.',
  },
  profile: {
    title: 'Profile',
    signOut: 'Sign out',
  },
  join: {
    received: 'Invitation received: {{token}}',
  },
  notFound: {
    title: 'Screen not found',
    goHome: 'Back to home',
  },
}

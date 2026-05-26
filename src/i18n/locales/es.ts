type Stringify<T> = T extends string
  ? string
  : { [K in keyof T]: Stringify<T[K]> }

const esStrict = {
  common: {
    continue: 'Continuar',
    cancel: 'Cancelar',
    accept: 'Aceptar',
    back: 'Volver',
    loading: 'Cargando…',
    retry: 'Reintentar',
  },
  auth: {
    signIn: {
      title: 'Iniciar sesión',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      submit: 'Continuar',
      codeTitle: 'Ingresa el código',
      codeSubtitle: 'Te enviamos un código a {{email}}',
      codeLabel: 'Código',
      codeSubmit: 'Verificar',
      noAccount: '¿No tienes cuenta?',
      goToSignUp: 'Crear cuenta',
    },
    signUp: {
      title: 'Crear cuenta',
      firstNameLabel: 'Nombre',
      firstNamePlaceholder: 'Tu nombre',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'tu@correo.com',
      submit: 'Continuar',
      codeTitle: 'Verifica tu correo',
      codeSubtitle: 'Te enviamos un código a {{email}}',
      codeLabel: 'Código',
      codeSubmit: 'Verificar',
      hasAccount: '¿Ya tienes cuenta?',
      goToSignIn: 'Iniciar sesión',
    },
    errors: {
      invalidEmail: 'El correo no es válido.',
      invalidCode: 'El código no es válido.',
      genericStart: 'No pudimos iniciar el proceso. Intenta de nuevo.',
      genericVerify: 'No pudimos verificar el código. Intenta de nuevo.',
    },
  },
  tabs: {
    trips: 'Viajes',
    alerts: 'Alertas',
    profile: 'Perfil',
  },
  home: {
    title: 'Mis viajes',
    greeting: 'Hola, {{name}}',
    newTrip: 'Nuevo viaje',
    placeholder: 'Tus viajes aparecerán aquí.',
  },
  alerts: {
    title: 'Alertas',
    empty: 'Sin alertas por ahora.',
  },
  profile: {
    title: 'Perfil',
    signOut: 'Cerrar sesión',
  },
  join: {
    received: 'Invitación recibida: {{token}}',
  },
  notFound: {
    title: 'Pantalla no encontrada',
    goHome: 'Volver al inicio',
  },
} as const

export type TranslationSchema = Stringify<typeof esStrict>

export const es: TranslationSchema = esStrict

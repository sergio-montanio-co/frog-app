# Copy

Reglas para todo texto visible en la app. Aplica a botones, títulos, labels, errores, estados vacíos, copy de onboarding — todo lo que el usuario lee dentro de la app.

- **Sentence case en todo:** botones, títulos, labels, errores. Nada de Title Case ni MAYÚSCULAS.
- **Sin emojis en la UI.** WhatsApp/email pueden tenerlos cuando el copy lo amerite, pero la app no.
- **Español neutral.** "Tú" no "vos". "Aceptar" no "OK".
- **Mensajes de error empiezan con el problema, no con disculpas.**
  - ✅ "El correo no es válido."
  - ❌ "Lo sentimos, ese correo parece estar mal."
- **Acciones en infinitivo:** "Crear viaje", "Reportar pago", "Continuar".
- **Estados vacíos amistosos pero sin chiste.** Una línea de qué pasa, una línea de qué hacer. Sin "¡Vaya!" ni "¡Ups!".

Todo texto pasa por `i18next` antes de llegar a la UI. Ver [`01-localization.md`](./01-localization.md) para reglas de claves y locales.

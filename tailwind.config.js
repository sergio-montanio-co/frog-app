/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#594731',
        background: '#F2EFEB',
        foreground: '#0D0D0D',
        secondary: '#736A62',
        muted: '#A69C94',
      },
      fontFamily: {
        sans: ['Quicksand_400Regular'],
        medium: ['Quicksand_500Medium'],
        semibold: ['Quicksand_600SemiBold'],
        bold: ['Quicksand_700Bold'],
      },
      borderRadius: {
        card: '12px',
      },
      borderWidth: {
        hairline: '0.5px',
      },
    },
  },
  plugins: [],
}

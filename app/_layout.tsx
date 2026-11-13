import '../global.css'
import '@/i18n'
import '@/lib/push/setup'

import { useEffect } from 'react'
import { LogBox } from 'react-native'
import { ClerkProvider, ClerkLoaded } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { Slot } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand'

import { queryClient } from '@/lib/api/query-client'
import { env } from '@/lib/env'

// Silencia warnings benignos y conocidos para que el banner de LogBox no
// aparezca en las screenshots de Maestro. Solo afecta dev (LogBox no existe
// en release). Si surge un warning nuevo y real, agrégalo aquí a conciencia.
LogBox.ignoreLogs([
  'Clerk has been loaded with development keys',
  'new NativeEventEmitter()',
  "Can't perform a React state update",
])

SplashScreen.preventAutoHideAsync().catch(() => {
  /* noop: splash may already be hidden in some scenarios */
})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined)
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <Slot />
          </QueryClientProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  )
}

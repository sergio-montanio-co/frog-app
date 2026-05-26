import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { useSignUp } from '@clerk/expo/legacy'
import { useTranslation } from 'react-i18next'

import { Text, Button, Input } from '@/components/atoms'

type Stage = 'form' | 'code'

export default function SignUpScreen() {
  const { t } = useTranslation()
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('form')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onStart() {
    if (!isLoaded) return
    setLoading(true)
    setError(null)
    try {
      await signUp.create({
        emailAddress: email,
        firstName: firstName.trim() || undefined,
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStage('code')
    } catch {
      setError(t('auth.errors.genericStart'))
    } finally {
      setLoading(false)
    }
  }

  async function onVerify() {
    if (!isLoaded) return
    setLoading(true)
    setError(null)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(app)/(tabs)')
      } else {
        setError(t('auth.errors.genericVerify'))
      }
    } catch {
      setError(t('auth.errors.invalidCode'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-4 pt-8 gap-6">
          <Text variant="display">{t('auth.signUp.title')}</Text>

          {stage === 'form' ? (
            <>
              <Input
                label={t('auth.signUp.firstNameLabel')}
                placeholder={t('auth.signUp.firstNamePlaceholder')}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="name-given"
              />
              <Input
                label={t('auth.signUp.emailLabel')}
                placeholder={t('auth.signUp.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={error ?? undefined}
              />
              <Button
                label={t('auth.signUp.submit')}
                onPress={onStart}
                loading={loading}
                disabled={email.trim().length === 0}
              />
              <View className="flex-row items-center gap-2">
                <Text tone="secondary">{t('auth.signUp.hasAccount')}</Text>
                <Link href="/(auth)/sign-in">
                  <Text tone="primary" variant="body-em">
                    {t('auth.signUp.goToSignIn')}
                  </Text>
                </Link>
              </View>
            </>
          ) : (
            <>
              <Text variant="title">{t('auth.signUp.codeTitle')}</Text>
              <Text tone="secondary">
                {t('auth.signUp.codeSubtitle', { email })}
              </Text>
              <Input
                label={t('auth.signUp.codeLabel')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                error={error ?? undefined}
              />
              <Button
                label={t('auth.signUp.codeSubmit')}
                onPress={onVerify}
                loading={loading}
                disabled={code.trim().length === 0}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

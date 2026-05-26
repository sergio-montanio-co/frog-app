import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { useSignIn } from '@clerk/expo/legacy'
import { useTranslation } from 'react-i18next'

import { Text, Button, Input } from '@/components/atoms'

type Stage = 'email' | 'code'

export default function SignInScreen() {
  const { t } = useTranslation()
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onStart() {
    if (!isLoaded) return
    setLoading(true)
    setError(null)
    try {
      const attempt = await signIn.create({ identifier: email })
      const emailFactor = attempt.supportedFirstFactors?.find(
        (f) => f.strategy === 'email_code',
      )
      if (!emailFactor || emailFactor.strategy !== 'email_code') {
        throw new Error('email_code factor unavailable')
      }
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      })
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
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      })
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
          <Text variant="display">{t('auth.signIn.title')}</Text>

          {stage === 'email' ? (
            <>
              <Input
                label={t('auth.signIn.emailLabel')}
                placeholder={t('auth.signIn.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={error ?? undefined}
              />
              <Button
                label={t('auth.signIn.submit')}
                onPress={onStart}
                loading={loading}
                disabled={email.trim().length === 0}
              />
              <View className="flex-row items-center gap-2">
                <Text tone="secondary">{t('auth.signIn.noAccount')}</Text>
                <Link href="/(auth)/sign-up">
                  <Text tone="primary" variant="body-em">
                    {t('auth.signIn.goToSignUp')}
                  </Text>
                </Link>
              </View>
            </>
          ) : (
            <>
              <Text variant="title">{t('auth.signIn.codeTitle')}</Text>
              <Text tone="secondary">
                {t('auth.signIn.codeSubtitle', { email })}
              </Text>
              <Input
                label={t('auth.signIn.codeLabel')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                error={error ?? undefined}
              />
              <Button
                label={t('auth.signIn.codeSubmit')}
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

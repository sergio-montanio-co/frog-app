import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { useSignIn } from '@clerk/expo/legacy'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Text, Button, Input, OtpInput, Card, Icon } from '@/components/atoms'
import { firstClerkErrorCode } from '@/lib/clerk/errors'
import { createPublicClient } from '@/lib/api/client'
import { env } from '@/lib/env'
import { colors } from '@/theme/colors'
import {
  clearPendingInvitation,
  getPendingInvitation,
} from '@/lib/invitations/pending'

type Stage = 'email' | 'code' | 'test-code'

const TEST_ACCOUNT_EMAIL = env.EXPO_PUBLIC_TEST_ACCOUNT_EMAIL.toLowerCase()

const emailSchema = z.object({
  email: z.string().trim().email(),
})
type EmailForm = z.infer<typeof emailSchema>

const codeSchema = z.object({
  code: z.string().trim().min(6, '6').max(6, '6'),
})
type CodeForm = z.infer<typeof codeSchema>

const testCodeSchema = z.object({
  code: z.string().trim().min(1).max(32),
})
type TestCodeForm = z.infer<typeof testCodeSchema>

export default function SignInScreen() {
  const { t } = useTranslation()
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  })

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
    mode: 'onSubmit',
  })

  const testCodeForm = useForm<TestCodeForm>({
    resolver: zodResolver(testCodeSchema),
    defaultValues: { code: '' },
    mode: 'onSubmit',
  })

  async function completeSignIn() {
    const pendingToken = await getPendingInvitation()
    if (pendingToken) {
      await clearPendingInvitation()
      router.replace({
        pathname: '/join/[token]',
        params: { token: pendingToken },
      })
    } else {
      router.replace('/(app)/(tabs)')
    }
  }

  async function onStart(values: EmailForm) {
    if (!isLoaded) return
    setSubmitError(null)
    // La cuenta de prueba entra por el bypass de ticket, no por OTP.
    if (values.email.trim().toLowerCase() === TEST_ACCOUNT_EMAIL) {
      setEmail(values.email.trim())
      setStage('test-code')
      return
    }
    try {
      const attempt = await signIn.create({ identifier: values.email })
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
      setEmail(values.email)
      setStage('code')
    } catch (err) {
      const code = firstClerkErrorCode(err)
      if (code === 'form_identifier_not_found') {
        setSubmitError(t('auth.errors.identifierNotFound'))
      } else if (code === 'too_many_requests') {
        setSubmitError(t('auth.errors.rateLimited'))
      } else {
        setSubmitError(t('auth.errors.genericStart'))
      }
    }
  }

  async function onVerify(values: CodeForm) {
    if (!isLoaded) return
    setSubmitError(null)
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: values.code,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        await completeSignIn()
      } else {
        setSubmitError(t('auth.errors.genericVerify'))
      }
    } catch (err) {
      const code = firstClerkErrorCode(err)
      if (code === 'form_code_incorrect') {
        setSubmitError(t('auth.errors.invalidCode'))
      } else if (code === 'too_many_requests') {
        setSubmitError(t('auth.errors.rateLimited'))
      } else {
        setSubmitError(t('auth.errors.genericVerify'))
      }
    }
  }

  async function onTestVerify(values: TestCodeForm) {
    if (!isLoaded) return
    setSubmitError(null)
    try {
      const client = createPublicClient()
      const { data, error } = await client.POST('/auth/test-signin', {
        body: { email, code: values.code },
      })
      if (error || !data) {
        setSubmitError(t('auth.signIn.testMode.error'))
        return
      }
      const result = await signIn.create({
        strategy: 'ticket',
        ticket: data.ticket,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        await completeSignIn()
      } else {
        setSubmitError(t('auth.signIn.testMode.error'))
      }
    } catch {
      setSubmitError(t('auth.signIn.testMode.error'))
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
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Input
                    testID="auth-email-input"
                    label={t('auth.signIn.emailLabel')}
                    placeholder={t('auth.signIn.emailPlaceholder')}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    leadingIcon="mail-outline"
                    error={
                      fieldState.error
                        ? t('auth.errors.invalidEmail')
                        : (submitError ?? undefined)
                    }
                  />
                )}
              />
              <Button
                label={t('auth.signIn.submit')}
                onPress={emailForm.handleSubmit(onStart)}
                loading={emailForm.formState.isSubmitting}
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
          ) : stage === 'code' ? (
            <>
              <Text variant="title">{t('auth.signIn.codeTitle')}</Text>
              <Text tone="secondary">
                {t('auth.signIn.codeSubtitle', { email })}
              </Text>
              <Controller
                control={codeForm.control}
                name="code"
                render={({ field, fieldState }) => (
                  <OtpInput
                    testID="auth-otp-input"
                    label={t('auth.signIn.codeLabel')}
                    helperText={t('auth.signIn.codeHelper')}
                    value={field.value}
                    onChangeText={field.onChange}
                    length={6}
                    onComplete={(v) => {
                      field.onChange(v)
                      codeForm.handleSubmit(onVerify)()
                    }}
                    error={
                      fieldState.error || submitError
                        ? (submitError ?? t('auth.errors.invalidCode'))
                        : undefined
                    }
                  />
                )}
              />
              <Button
                label={t('auth.signIn.codeSubmit')}
                onPress={codeForm.handleSubmit(onVerify)}
                loading={codeForm.formState.isSubmitting}
              />
              <Button
                label={t('auth.signIn.changeEmail')}
                variant="ghost"
                onPress={() => {
                  codeForm.reset({ code: '' })
                  setSubmitError(null)
                  setStage('email')
                }}
              />
            </>
          ) : (
            <>
              <Card className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Icon name="science" size={20} color={colors.secondary} />
                  <Text variant="body-em">
                    {t('auth.signIn.testMode.title')}
                  </Text>
                </View>
                <Text variant="caption" tone="secondary">
                  {t('auth.signIn.testMode.body')}
                </Text>
              </Card>
              <Controller
                control={testCodeForm.control}
                name="code"
                render={({ field, fieldState }) => (
                  <Input
                    testID="auth-test-code-input"
                    label={t('auth.signIn.testMode.codeLabel')}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    keyboardType="number-pad"
                    secureTextEntry
                    autoComplete="off"
                    error={
                      fieldState.error || submitError
                        ? (submitError ?? t('auth.signIn.testMode.error'))
                        : undefined
                    }
                  />
                )}
              />
              <Button
                label={t('auth.signIn.testMode.cta')}
                onPress={testCodeForm.handleSubmit(onTestVerify)}
                loading={testCodeForm.formState.isSubmitting}
              />
              <Button
                label={t('auth.signIn.testMode.back')}
                variant="ghost"
                onPress={() => {
                  testCodeForm.reset({ code: '' })
                  setSubmitError(null)
                  setStage('email')
                }}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

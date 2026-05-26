import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { useSignIn } from '@clerk/expo/legacy'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Text, Button, Input } from '@/components/atoms'
import { firstClerkErrorCode } from '@/lib/clerk/errors'

type Stage = 'email' | 'code'

const emailSchema = z.object({
  email: z.string().trim().email(),
})
type EmailForm = z.infer<typeof emailSchema>

const codeSchema = z.object({
  code: z.string().trim().min(6, '6').max(6, '6'),
})
type CodeForm = z.infer<typeof codeSchema>

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

  async function onStart(values: EmailForm) {
    if (!isLoaded) return
    setSubmitError(null)
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
        router.replace('/(app)/(tabs)')
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
                    label={t('auth.signIn.emailLabel')}
                    placeholder={t('auth.signIn.emailPlaceholder')}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
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
          ) : (
            <>
              <Text variant="title">{t('auth.signIn.codeTitle')}</Text>
              <Text tone="secondary">
                {t('auth.signIn.codeSubtitle', { email })}
              </Text>
              <Controller
                control={codeForm.control}
                name="code"
                render={({ field, fieldState }) => (
                  <Input
                    label={t('auth.signIn.codeLabel')}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    maxLength={6}
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

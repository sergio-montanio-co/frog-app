import { useState } from 'react'
import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { useSignUp } from '@clerk/expo/legacy'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { Text, Button, Input, OtpInput } from '@/components/atoms'
import { firstClerkErrorCode } from '@/lib/clerk/errors'
import {
  clearPendingInvitation,
  getPendingInvitation,
} from '@/lib/invitations/pending'

type Stage = 'form' | 'code'

const formSchema = z.object({
  firstName: z.string().trim().max(64).optional().or(z.literal('')),
  email: z.string().trim().email(),
})
type SignUpForm = z.infer<typeof formSchema>

const codeSchema = z.object({
  code: z.string().trim().min(6, '6').max(6, '6'),
})
type CodeForm = z.infer<typeof codeSchema>

export default function SignUpScreen() {
  const { t } = useTranslation()
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()
  const qc = useQueryClient()

  const [stage, setStage] = useState<Stage>('form')
  const [email, setEmail] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resendBusy, setResendBusy] = useState(false)
  const [resendFeedback, setResendFeedback] = useState<string | null>(null)

  const form = useForm<SignUpForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: '', email: '' },
    mode: 'onSubmit',
  })

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
    mode: 'onSubmit',
  })

  async function onStart(values: SignUpForm) {
    if (!isLoaded) return
    setSubmitError(null)
    try {
      await signUp.create({
        emailAddress: values.email,
        firstName: values.firstName?.trim() || undefined,
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setEmail(values.email)
      setStage('code')
    } catch (err) {
      const code = firstClerkErrorCode(err)
      if (code === 'form_identifier_exists') {
        setSubmitError(t('auth.errors.identifierExists'))
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
    setResendFeedback(null)
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: values.code,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        await qc.invalidateQueries({ queryKey: ['me'] })
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
        return
      }
      // El email verificó OK pero Clerk sigue pidiendo algo (password,
      // last_name, phone, etc. según la config del instance).
      const missing = [
        ...(result.missingFields ?? []),
        ...(result.unverifiedFields ?? []),
      ]
      console.warn('sign-up not complete', {
        status: result.status,
        missingFields: result.missingFields,
        unverifiedFields: result.unverifiedFields,
      })
      setSubmitError(
        missing.length > 0
          ? t('auth.errors.signUpMissingFields', {
              fields: missing.join(', '),
            })
          : t('auth.errors.signUpIncomplete'),
      )
    } catch (err) {
      const code = firstClerkErrorCode(err)
      if (code === 'form_code_incorrect' || code === 'verification_failed') {
        setSubmitError(t('auth.errors.invalidCode'))
      } else if (
        code === 'verification_expired' ||
        code === 'verification_already_verified'
      ) {
        setSubmitError(t('auth.errors.genericVerify'))
      } else if (code === 'too_many_requests') {
        setSubmitError(t('auth.errors.rateLimited'))
      } else {
        console.warn('sign-up verify error', err)
        setSubmitError(t('auth.errors.genericVerify'))
      }
    }
  }

  async function onResend() {
    if (!isLoaded) return
    setSubmitError(null)
    setResendFeedback(null)
    setResendBusy(true)
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      codeForm.reset({ code: '' })
      setResendFeedback(t('auth.signUp.codeResent'))
    } catch (err) {
      const code = firstClerkErrorCode(err)
      if (code === 'verification_already_verified') {
        setSubmitError(t('auth.errors.emailAlreadyVerified'))
      } else if (code === 'too_many_requests') {
        setSubmitError(t('auth.errors.rateLimited'))
      } else {
        console.warn('sign-up resend error', err)
        setSubmitError(t('auth.errors.resendGeneric'))
      }
    } finally {
      setResendBusy(false)
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
              <Controller
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <Input
                    label={t('auth.signUp.firstNameLabel')}
                    placeholder={t('auth.signUp.firstNamePlaceholder')}
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    autoCapitalize="words"
                    autoComplete="name-given"
                  />
                )}
              />
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Input
                    label={t('auth.signUp.emailLabel')}
                    placeholder={t('auth.signUp.emailPlaceholder')}
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
                label={t('auth.signUp.submit')}
                onPress={form.handleSubmit(onStart)}
                loading={form.formState.isSubmitting}
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
              <Controller
                control={codeForm.control}
                name="code"
                render={({ field, fieldState }) => (
                  <OtpInput
                    label={t('auth.signUp.codeLabel')}
                    helperText={t('auth.signUp.codeHelper')}
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
                label={t('auth.signUp.codeSubmit')}
                onPress={codeForm.handleSubmit(onVerify)}
                loading={codeForm.formState.isSubmitting}
              />
              <Button
                label={t('auth.signUp.resendCode')}
                variant="secondary"
                onPress={onResend}
                loading={resendBusy}
              />
              {resendFeedback ? (
                <Text variant="caption" tone="secondary">
                  {resendFeedback}
                </Text>
              ) : null}
              <Button
                label={t('auth.signUp.changeEmail')}
                variant="ghost"
                onPress={() => {
                  codeForm.reset({ code: '' })
                  setSubmitError(null)
                  setResendFeedback(null)
                  setStage('form')
                }}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

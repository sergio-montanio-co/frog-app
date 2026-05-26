import { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button, Input, Text } from '@/components/atoms'
import { useMe, useUpdateMe } from '@/lib/api/queries'
import { colors } from '@/theme/colors'

const schema = z.object({
  displayName: z.string().trim().min(1, 'required').max(64, 'tooLong'),
})
type EditForm = z.infer<typeof schema>

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const me = useMe()
  const updateMe = useUpdateMe()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<EditForm>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: me.data?.displayName ?? '' },
    mode: 'onSubmit',
  })

  async function onSubmit(values: EditForm) {
    setSubmitError(null)
    try {
      await updateMe.mutateAsync({ displayName: values.displayName })
      router.back()
    } catch {
      setSubmitError(t('profile.edit.genericError'))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('profile.edit.title'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: 'Quicksand_600SemiBold' },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-4 pt-4 gap-6">
          <Controller
            control={form.control}
            name="displayName"
            render={({ field, fieldState }) => (
              <Input
                label={t('profile.edit.displayNameLabel')}
                placeholder={t('profile.edit.displayNamePlaceholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                autoCapitalize="words"
                autoComplete="name"
                maxLength={64}
                error={
                  fieldState.error?.message === 'required'
                    ? t('profile.edit.displayNameRequired')
                    : fieldState.error?.message === 'tooLong'
                      ? t('profile.edit.displayNameTooLong')
                      : (submitError ?? undefined)
                }
              />
            )}
          />
          <Button
            label={t('profile.edit.save')}
            onPress={form.handleSubmit(onSubmit)}
            loading={updateMe.isPending}
          />
          {submitError ? (
            <Text variant="caption" tone="primary">
              {submitError}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

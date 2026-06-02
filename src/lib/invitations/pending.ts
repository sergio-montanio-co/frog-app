import * as SecureStore from 'expo-secure-store'

const KEY = 'frog.pending_invitation'

export async function getPendingInvitation(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY)
}

export async function clearPendingInvitation(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY)
}

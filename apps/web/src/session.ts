export async function signOut(logout: () => Promise<unknown>, clearCache: () => Promise<unknown>): Promise<void> {
  await logout()
  await clearCache()
}

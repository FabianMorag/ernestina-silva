import assert from 'node:assert/strict'
import { test } from 'node:test'
import { signOut } from './session.ts'

test('sign-out clears cached user and admin data after server logout', async () => {
  const calls: string[] = []
  await signOut(
    async () => { calls.push('server logout') },
    async () => { calls.push('clear cache') },
  )
  assert.deepEqual(calls, ['server logout', 'clear cache'])
})

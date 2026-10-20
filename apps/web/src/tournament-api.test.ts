import assert from 'node:assert/strict'
import { test } from 'node:test'
import { patchRequest, request } from './tournament-api.ts'

test('PATCH player edits use the admin session and do not change GET/POST behavior', async () => {
  const calls: Array<{ url: string; options: RequestInit }> = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options: options ?? {} })
    return { ok: true, json: async () => ({ id: 'player' }) } as Response
  }
  try {
    await request('/tournament/players')
    await request('/admin/players', { name: 'nico' })
    await patchRequest('/admin/players/player', { name: 'Nico', title: null })
    assert.deepEqual(calls.map(({ options }) => options.method), ['GET', 'POST', 'PATCH'])
    assert.equal(calls[2].options.credentials, 'same-origin')
    assert.equal(calls[2].url, '/api/admin/players/player')
  } finally {
    globalThis.fetch = originalFetch
  }
})

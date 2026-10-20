import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deleteRequest, patchRequest, request } from './tournament-api.ts'

test('DELETE removes the selected match with the admin session', async () => {
  const calls: Array<{ url: string; options: RequestInit }> = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options: options ?? {} })
    return { ok: true, json: async () => ({ deleted: true }) } as Response
  }
  try {
    assert.deepEqual(await deleteRequest('/admin/matches/match'), {
      deleted: true,
    })
    assert.equal(calls[0].url, '/api/admin/matches/match')
    assert.equal(calls[0].options.method, 'DELETE')
    assert.equal(calls[0].options.credentials, 'same-origin')
  } finally {
    globalThis.fetch = originalFetch
  }
})

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
    assert.deepEqual(
      calls.map(({ options }) => options.method),
      ['GET', 'POST', 'PATCH'],
    )
    assert.equal(calls[2].options.credentials, 'same-origin')
    assert.equal(calls[2].url, '/api/admin/players/player')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('PATCH match edits send only stage and scores', async () => {
  const calls: Array<{ url: string; options: RequestInit }> = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options: options ?? {} })
    return { ok: true, json: async () => ({ updated: true }) } as Response
  }
  try {
    await patchRequest('/admin/matches/match', {
      stageId: 'stage',
      homeScore: 4,
      awayScore: 1,
    })
    assert.equal(calls[0].url, '/api/admin/matches/match')
    assert.equal(calls[0].options.method, 'PATCH')
    assert.deepEqual(JSON.parse(String(calls[0].options.body)), {
      stageId: 'stage',
      homeScore: 4,
      awayScore: 1,
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function getRewrites() {
  const config = JSON.parse(
    await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
  ) as { rewrites: Array<{ source: string; destination: string }> }
  return config.rewrites
}

test('proxies API requests to the API project before the SPA fallback', async () => {
  const rewrites = await getRewrites()
  assert.deepEqual(rewrites[0], {
    source: '/api/:path*',
    destination: 'https://ernestina-silva.vercel.app/:path*',
  })
})

test('serves the SPA entrypoint for deep links', async () => {
  const rewrites = await getRewrites()
  assert.deepEqual(rewrites[1], {
    source: '/(.*)',
    destination: '/index.html',
  })
})
